(function() {
  var __slice = Array.prototype.slice;

  define("severus", function() {
    var credentials, drews, extend, find, log, login, nimble, remove, save, self, serv, server, serverCallMaker, _;
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
          sessionId: self.sessionId,
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
    serv = function() {
      var args, call, cb, _i;
      call = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      return server.apply(null, [call, self.sessionId, self.db].concat(__slice.call(args), [cb]));
    };
    login = function(username, password, cb) {
      return server("login", self.db, username, password, function(err, user) {
        self.sessionId = user.sessionId;
        self.user = user;
        return cb(null, user);
      });
    };
    return _.extend(self, {
      save: save,
      find: find,
      remove: remove,
      login: login,
      serv: serv,
      server: server
    });
  });

}).call(this);
