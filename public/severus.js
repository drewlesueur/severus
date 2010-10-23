(function() {
  var $, Severus, _, uniqueid;
  Severus = {};
  this.Severus = Severus;
  _ = this._;
  $ = this.$;
  uniqueid = 0;
  Severus.successes = {};
  Severus.errors = {};
  Severus.initialize = function(url, callback) {
    var iframe, self;
    this.url = url || "/iframe.html";
    iframe = $("<iframe src=\"" + (this.url) + "\" ></iframe>");
    iframe.bind("load", function() {
      return Severus.ajax({
        url: "/",
        type: "GET",
        success: function(data) {
          console.log(data);
          window.username = data;
          return callback();
        }
      });
    });
    $(document.body).append(iframe);
    this.iframe = iframe[0];
    self = this;
    return window.addEventListener("message", function(e) {
      var _a, _b, _c, _d, data, id, message, type;
      message = JSON.parse(e.data);
      id = message.id;
      data = message.data;
      type = message.type;
      if (type === "success" && (typeof (_a = self.successes) !== "undefined" && _a !== null) && id in self.successes) {
        self.successes[id](data);
      } else if (type === "error" && (typeof (_b = self.errors) !== "undefined" && _b !== null) && id in self.errors) {
        self.errors[id](data);
      }
      if ((typeof (_c = self.successes) !== "undefined" && _c !== null) && id in self.successes) {
        delete self.successes[id];
      }
      return (typeof (_d = self.errors) !== "undefined" && _d !== null) && id in self.errors ? delete self.errors[id] : null;
    }, false);
  };
  Severus.ajax = function(args) {
    var _a, _b, id, wrapped;
    id = uniqueid++;
    wrapped = {
      id: id,
      args: args
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
  Severus.acceptMessages = function(whitelist) {
    whitelist = whitelist || [];
    return window.addEventListener("message", function(e) {
      var _a, _b, args, id, message, posted;
      if (whitelist.length === 0 || _.indexOf(whitelist, e.origin) !== -1) {
        message = JSON.parse(e.data);
        args = message.args;
        id = message.id;
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
      }
    }, false);
  };
})();
