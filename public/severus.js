(function() {
  var $, Severus, _, uniqueid;
  Severus = {};
  this.Severus = Severus;
  _ = this._;
  $ = this.$;
  uniqueid = 0;
  Severus.successes = {};
  Severus.errors = {};
  Severus.callbacks = {};
  Severus.initialize = function(url, callback) {
    var iframe, self, sev;
    this.url = url || "/iframe.html";
    sev = this;
    iframe = $("<iframe src=\"" + (this.url) + "\" ></iframe>");
    iframe.bind("load", function() {
      return Severus.set({
        url: sev.url
      }, function(data) {
        return callback();
      });
    });
    $(document.body).append(iframe);
    this.iframe = iframe[0];
    self = this;
    return window.addEventListener("message", function(e) {
      var _a, _b, _c, _d, _e, data, id, message, type;
      message = JSON.parse(e.data);
      id = message.id;
      data = message.data;
      type = message.type;
      if (type === "success" && (typeof (_a = self.successes) !== "undefined" && _a !== null) && id in self.successes) {
        self.successes[id](data);
      } else if (type === "error" && (typeof (_b = self.errors) !== "undefined" && _b !== null) && id in self.errors) {
        self.errors[id](data);
      } else if (type === "callback") {
        self.callbacks[id](data);
      } else if (type === "redirect") {
        location.href = data.url;
      }
      if ((typeof (_c = self.successes) !== "undefined" && _c !== null) && id in self.successes) {
        delete self.successes[id];
      }
      if ((typeof (_d = self.errors) !== "undefined" && _d !== null) && id in self.errors) {
        delete self.errors[id];
      }
      return (typeof (_e = self.callbacks) !== "undefined" && _e !== null) && id in self.callbacks ? delete self.errors[id] : null;
    }, false);
  };
  Severus.facebook = {
    client_id: "162705547084211"
  };
  Severus.server = function(method, args, func) {
    return Severus.ajax({
      type: "POST",
      url: ("/" + (method)),
      data: {
        "q": JSON.stringify(args)
      },
      success: function(data) {
        return func && func(data);
      }
    });
  };
  Severus.ajax = function(args) {
    var _a, _b, id, wrapped;
    id = uniqueid++;
    wrapped = {
      id: id,
      args: args,
      type: "ajax"
    };
    this.successes[id] = args.success;
    this.errors[id] = args.errors;
    if (typeof (_a = args.success) !== "undefined" && _a !== null) {
      args.success = id;
    }
    if (typeof (_b = args.error) !== "undefined" && _b !== null) {
      args.error = id;
    }
    return this.iframe.contentWindow.postMessage(JSON.stringify(wrapped), "*");
  };
  Severus.login = function(loc, callback) {
    loc = loc || location.href;
    return Severus.post("login", {
      loc: "1",
      callback: callback
    });
  };
  Severus.set = function(sets, callback) {
    var args;
    args = {};
    args.sets = sets;
    args.callback = callback;
    return Severus.post("set", args);
  };
  Severus.post = function(type, args) {
    var _a, id, wrapped;
    id = uniqueid++;
    wrapped = {
      id: id,
      args: args,
      type: type
    };
    this.callbacks[id] = args.callback;
    if (typeof (_a = args.callback) !== "undefined" && _a !== null) {
      args.callback = id;
    }
    return this.iframe.contentWindow.postMessage(JSON.stringify(wrapped), "*");
  };
  Severus.acceptMessages = function(whitelist) {
    var sev;
    whitelist = whitelist || [];
    sev = this;
    return window.addEventListener("message", function(e) {
      var _a, _b, args, id, message, post, posted, redirect_uri, url;
      if (whitelist.length === 0 || _.indexOf(whitelist, e.origin) !== -1) {
        message = JSON.parse(e.data);
        args = message.args;
        id = message.id;
        if (message.type === "ajax") {
          posted = {
            id: id,
            type: "success",
            dataType: args.dataType
          };
          if (typeof (_a = args.success) !== "undefined" && _a !== null) {
            args.success = function(data) {
              posted.data = data;
              return parent.postMessage(JSON.stringify(posted), "*");
            };
          }
          if (typeof (_b = args.error) !== "undefined" && _b !== null) {
            args.error = function(data) {
              posted.type = "error";
              posted.data = data;
              return parent.postMessage(JSON.stringify(poted), "*");
            };
          }
          return $.ajax(args);
        } else if (message.type === "login") {
          url = "https://graph.facebook.com/oauth/authorize";
          url += ("?client_id=" + (Severus.facebook.client_id));
          url += "&type=user_agent";
          redirect_uri = encodeURIComponent(sev.url + "?redirect_url=" + encodeURIComponent(args.loc));
          url += ("&redirect_uri=" + (redirect_uri));
          post = {
            type: "redirect",
            data: {
              url: url
            }
          };
          return parent.postMessage(JSON.stringify(post), "*");
        } else if (message.type === "set") {
          _.extend(sev, message.args.sets);
          posted = {
            id: id,
            type: "callback",
            data: "yay"
          };
          return parent.postMessage(JSON.stringify(posted), "*");
        }
      }
    }, false);
  };
})();
