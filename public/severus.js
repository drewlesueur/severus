(function() {
  (function() {
    var $, Severus, _;
    Severus = {};
    this.Severus = Severus;
    _ = this._;
    $ = this.$;
    Severus.initialize = function(url, callback) {
      var iframe;
      this.url = url || "/iframe.html";
      console.log(this.url);
      iframe = $("<iframe src=\"" + (this.url) + "\" ></iframe>");
      iframe.bind("load", function() {
        return callback();
      });
      $(document.body).append(iframe);
      this.iframe = iframe[0];
      return window.addEventListener("message", function(e) {
        var data, id, message, type;
        console.log(e.data);
        message = JSON.parse(e.data);
        id = message.id;
        data = message.data;
        type = message.type;
        if (type === "success" && id in this.successes) {
          this.successes[id](data);
          return delete this.successes[id];
        } else if (type === "error" && id in this.errors) {
          this.errors[id](data);
          return delete this.errors[id];
        }
      }, false);
    };
    Severus.successes = {};
    Severus.errors = {};
    Severus.ajax = function(args) {
      var _a, _b, id, wrapped;
      id = ("" + (_.rnd(1, 5000)) + (_.time()));
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
    return (Severus.acceptMessages = function(whitelist) {
      whitelist = whitelist || [];
      return window.addEventListener("message", function(e) {
        var _a, _b, args, id, message;
        if (whitelist.length === 0 || _.indexOf(whitelist, e.origin) !== -1) {
          message = JSON.parse(e.data);
          args = message.args;
          id = message.id;
          if (typeof (_a = args.success) !== "undefined" && _a !== null) {
            args.success = function(data) {
              var posted;
              posted = {
                id: id,
                type: "success",
                data: data
              };
              return parent.postMessage(JSON.stringify(posted), "*");
            };
          }
          if (typeof (_b = args.error) !== "undefined" && _b !== null) {
            args.error = function(data) {
              var posted;
              posted = {
                id: id,
                type: "error",
                data: data
              };
              return parent.postMessage(JSON.stringify(poted), "*");
            };
          }
          return $.ajax(args);
        }
      }, false);
    });
  })();
})();
