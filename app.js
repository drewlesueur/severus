(function() {
  var app, authenticateUser, bind, collections, config, count, createSession, createUser, crypto, deleteSession, drews, drewsSignIn, enableCORS, errorMaker, express, find, findOne, getCollection, insert, log, login, md5, mongo, mongoHost, mongoPort, mongoServer, once, pg, remove, rpcMethods, save, test, trigger, userExists, wait, whoami, _;
  var __slice = Array.prototype.slice;
  config = require('./config.coffee');
  _ = require("underscore");
  drews = require("drews-mixins");
  mongo = require("mongodb");
  mongoHost = config.db.host;
  mongoPort = config.db.port || mongo.Connection.DEFAULT_PORT;
  crypto = require("crypto");
  wait = _.wait, trigger = _.trigger, bind = _.bind, once = _.once, log = _.log;
  express = require('express');
  drewsSignIn = function(req, res, next) {
    req.isSignedIn = function() {
      return req.session.email !== null;
    };
    return next();
  };
  enableCORS = function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
  };
  app = module.exports = express.createServer();
  app.configure(function() {
    app.use(enableCORS);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: "boom shaka laka"
    }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    return app.use(drewsSignIn);
  });
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  pg = function(p, f) {
    app.post(p, f);
    return app.get(p, f);
  };
  count = 0;
  mongoServer = new mongo.Server(mongoHost, mongoPort, {});
  collections = {};
  getCollection = function(db, collection, cb) {
    var cacheCollection, cachedCollection, getDb, gettingDb, haveCollection, mayHaveDb, startGettingCollection, startGettingDb;
    if (cb == null) {
      cb = function() {};
    }
    mayHaveDb = function() {
      return db in collections;
    };
    gettingDb = function() {
      return collections[db].state === "getting";
    };
    haveCollection = function() {
      return collection in collections[db].cns;
    };
    cachedCollection = function() {
      return collections[db].cns[collection];
    };
    getDb = function() {
      return collections[db].db;
    };
    cacheCollection = function(c) {
      return collections[db].cns[collection] = c;
    };
    startGettingDb = function() {
      var dbBig;
      dbBig = new mongo.Db(db, mongoServer, {});
      collections[db] = {};
      collections[db].state = "getting";
      collections[db].db = dbBig;
      collections[db].cns = {};
      return dbBig.open(function(err, _db) {
        var ObjectID;
        ObjectID = dbBig.bson_serializer.ObjectID;
        collections[db].ObjectID = ObjectID;
        collections[db].db = _db;
        collections[db].state = "gotten";
        trigger(collections[db], "gotten");
        return startGettingCollection();
      });
    };
    startGettingCollection = function() {
      return getDb().collection(collection, function(err, _collection) {
        cacheCollection(_collection);
        return cb(err, _collection, collections[db]);
      });
    };
    count++;
    if (mayHaveDb()) {
      if (gettingDb()) {
        return once(collections[db], "gotten", startGettingCollection);
      } else if (haveCollection()) {
        return cb(null, cachedCollection(), collections[db]);
      } else {
        return startGettingCollection();
      }
    } else {
      return startGettingDb();
    }
  };
  getCollection("office_test", "listings", function(err, c) {
    return c.find().toArray(function(err, _docs) {
      return log("separator");
    });
  });
  getCollection("office_test", "listings", function(err, c) {
    return c.find().toArray(function(err, _docs) {
      return log("separator");
    });
  });
  getCollection("office_test", "listings", function(err, c) {
    return c.find().toArray(function(err, _docs) {
      return log("separator");
    });
  });
  remove = function(args, cb) {
    var collection, db, obj, user;
    db = args.db, collection = args.collection, obj = args.obj, user = args.user;
    obj || (obj = {});
    return getCollection(db, collection, function(err, _collection, extra) {
      if (err) {
        return cb(err);
      }
      if (_.isString(obj)) {
        obj = collections[db].ObjectID.createFromHexString(obj);
      }
      return _collection.remove(obj, function(err, theArray) {
        return cb(err, theArray);
      });
    });
  };
  findOne = function(args, cb) {
    args.oneOrMany = "one";
    return find(args, cb);
  };
  find = function(args, cb) {
    var collection, db, obj, oneOrMany, sessionId;
    db = args.db, collection = args.collection, obj = args.obj, oneOrMany = args.oneOrMany, sessionId = args.sessionId;
    oneOrMany || (oneOrMany = "many");
    obj || (obj = {});
    return getCollection(db, collection, function(err, _collection, extra) {
      if (err) {
        return cb(err);
      }
      if (_.isString(obj)) {
        obj = collections[db].ObjectID.createFromHexString(obj);
      }
      if (oneOrMany === "many") {
        return _collection.find(obj).toArray(function(err, theArray) {
          return cb(err, theArray);
        });
      } else {
        return _collection.findOne(obj, function(err, _document) {
          return cb(err, _document);
        });
      }
    });
  };
  save = function(args, cb) {
    var collection, db, obj, sessionId;
    db = args.db, collection = args.collection, obj = args.obj, sessionId = args.sessionId;
    if ("_id" in obj) {
      obj._id = collections[db].ObjectID.createFromHexString(obj._id);
    }
    return getCollection(db, collection, function(err, _collection, extra) {
      if (err) {
        return cb(err);
      }
      return _collection.insert(obj, function(err, _objs) {
        return cb(err, _objs);
      });
    });
  };
  insert = save;
  userExists = function(db, username, cb) {
    return getCollection(db, "users", function(err, users) {
      return users.findOne({
        username: username
      }, function(err, user) {
        if (user) {
          return cb(err, user);
        } else {
          return cb(err, false);
        }
      });
    });
  };
  createSession = function(db, userId, cb) {
    return getCollection(db, "sessions", function(err, sessions) {
      var sessionId;
      sessionId = _.uuid();
      return sessions.insert({
        userId: userId,
        sessionId: sessionId
      }, function(err, sessions) {
        return cb(err, sessions[0]);
      });
    });
  };
  deleteSession = function(db, userId, cb) {
    return getCollection(cb, "sessions", function(err, sessions) {
      return sessions.remove({
        sessionId: sessionId
      }, cb);
    });
  };
  createUser = function(db, username, password, cb) {
    return getCollection(db, "users", function(err, users) {
      return users.insert({
        username: username,
        password: md5(password)
      }, cb);
    });
  };
  md5 = function(data) {
    return crypto.createHash('md5').update(data).digest("hex");
  };
  authenticateUser = function(db, username, password, cb) {
    return getCollection(db, "users", function(err, users) {
      return users.findOne({
        username: username,
        password: md5(password)
      }, function(err, user) {
        if (user) {
          return cb(err, user);
        } else {
          return cb(err, false);
        }
      });
    });
  };
  login = function(db, username, password, cb) {
    return userExists(db, username, function(err, user) {
      if (user === false) {
        return createUser(db, username, password, function(err, user) {
          return createSession(db, user._id, function(err, session) {
            return cb(err, _.extend(user, session));
          });
        });
      } else {
        return authenticateUser(db, username, password, function(err, user) {
          return createSession(db, user._id, function(err, session) {
            return cb(err, _.extend(user, session));
          });
        });
      }
    });
  };
  whoami = function(sessionId, db, cb) {
    return getCollection(db, "sessions", function(err, sessions) {
      return sessions.findOne({
        sessionId: sessionId
      }, function(err, session) {
        return getCollection(db, "users", function(err, users) {
          return users.findOne(session.userId, function(err, user) {
            return cb(err, user);
          });
        });
      });
    });
  };
  app.get("/:db/:collection/:id", function(req, res) {
    var collection, db, id, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection, id = _ref.id;
    return find(db, collection, {
      _id: id
    }, function(err, _document) {
      return res.send(_document);
    });
  });
  app.get("/:db/:collection", function(req, res) {
    var collection, db, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection;
    find(db, collection, function(err, _array) {
      return res.send(_array);
    });
    return getCollection(db, collection, function(err, _collection) {
      if (err) {
        return log("error");
      }
      return _collection.find().toArray(function(err, theArray) {
        return res.send(theArray);
      });
    });
  });
  app.post("/:db/:collection", function(req, res) {
    var collection, db, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection;
    return save(db, collection, req.body, function(err) {
      return res.send({});
    });
  });
  false && app["delete"]("/:db/:collection/:id", function(req, res) {
    var collection, db, id, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection, id = _ref.id;
    return getCollection(db, collection, function(err, _collection, extra) {
      var _id;
      _id = collections[db].ObjectID.createFromHexString(id);
      return _collection.remove({
        _id: _id
      }, function(err) {
        return res.send({});
      });
    });
  });
  app.get("/drew", function(req, res) {
    return res.send("aguzate, hazte valer");
  });
  pg("/p", function(req, res) {
    req.session.poo = "gotta";
    return res.send("that is all");
  });
  pg("/whoami", function(req, res) {
    return res.send(req.session);
  });
  test = function() {
    var a, b, cb, _i;
    a = arguments[0], b = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
    return cb(null, {
      yo: "" + a + " yo"
    });
  };
  rpcMethods = {
    login: login,
    save: save,
    find: find,
    findOne: findOne,
    remove: remove,
    test: test,
    whoami: whoami
  };
  errorMaker = function(error) {
    return function() {
      var args, cb, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      return cb(error, null);
    };
  };
  pg("/rpc", function(req, res) {
    var body, fn, id, method, params;
    body = req.body;
    method = body.method, params = body.params, id = body.id;
    fn = rpcMethods[method] || errorMaker("no such method " + method);
    return fn.apply(null, __slice.call(params).concat([function(err, result) {
      return res.send({
        result: result,
        error: err,
        id: id
      });
    }]));
  });
  exports.app = app;
  if (!module.parent) {
    app.listen(config.server.port || 8001);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
