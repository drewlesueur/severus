(function() {
  var __slice = Array.prototype.slice;
  define("severus", function() {
    var credentials, drews, extend, find, log, nimble, remove, save, self, server, serverCallMaker, _;
    _ = require("underscore");
    drews = require("drews-mixins");
    nimble = require("nimble");
    server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/");
    extend = _.extend, log = _.log;
    self = {};
    self.db = "severus_drewl_us";
    credentials = {};
    self.credentials = credentials;
    serverCallMaker = function(call) {
      return function() {
        var args, cb, collection, extra, obj, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
        collection = args[0], obj = args[1], extra = args[2];
        extra || (extra = {});
        args = {
          db: self.db,
          collection: collection,
          obj: obj
        };
        extend(args, extra);
        return server(call, args, cb);
      };
    };
    save = serverCallMaker("save");
    find = serverCallMaker("find");
    remove = serverCallMaker("remove");
    return _.extend(self, {
      save: save,
      find: find,
      remove: remove
    });
  });
}).call(this);
