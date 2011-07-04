(function() {
  var app, authenticateUser, bind, collections, config, count, createSession, createUser, crypto, db_is_being_opened, deleteSession, drews, drewsSignIn, enableCORS, errorMaker, express, find, findOne, getCollection, getGroups, getReaders, getValueMaker, getWriters, log, login, md5, mongo, mongoHost, mongoPort, mongoServer, nimble, once, parallel, pg, remove, rpcMethods, save, series, test, trigger, userExists, wait, whoami, _;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  config = require('./config.coffee');
  _ = require("underscore");
  drews = require("drews-mixins");
  mongo = require("mongodb");
  nimble = require("nimble");
  mongoHost = config.db.host;
  mongoPort = config.db.port || mongo.Connection.DEFAULT_PORT;
  crypto = require("crypto");
  wait = _.wait, trigger = _.trigger, bind = _.bind, once = _.once, log = _.log;
  series = nimble.series, parallel = nimble.parallel;
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
  db_is_being_opened = false;
  getCollection = function(db, collection, cb) {
    var cacheCollection, cachedCollection, getDb, gettingDb, giveCollection, haveCollection, mayHaveDb, startGettingCollection, startGettingDb;
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
      collections[db] || (collections[db] = {});
      collections[db].state = "getting";
      if (db_is_being_opened) {
        return wait(500, function() {
          return startGettingDb();
        });
        return;
      }
      db_is_being_opened = true;
      dbBig = new mongo.Db(db, mongoServer, {});
      collections[db].db = dbBig;
      collections[db].cns = {};
      return dbBig.open(function(err, _db) {
        var ObjectID;
        db_is_being_opened = false;
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
    giveCollection = function() {
      if (haveCollection()) {
        return cb(null, cachedCollection(), collections[db]);
      } else {
        return startGettingCollection();
      }
    };
    if (mayHaveDb()) {
      if (gettingDb()) {
        return once(collections[db], "gotten", function() {
          return giveCollection();
        });
      } else {
        return giveCollection();
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
  getCollection("office_test", "listings_groups", function(err, c) {
    return c.find().toArray(function(err, _docs) {
      return log("separator groups");
    });
  });
  getCollection("severus_the_tl", "users", function(err, users) {
    return log("Should only be here once");
  });
  getCollection("severus_the_tl", "user_groups", function(err, users) {
    return log("this once too");
  });
  getCollection("office_test", "listings_groups", function(err, c) {
    return c.find().toArray(function(err, _docs) {
      return log("separator groups again");
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
  getValueMaker = function(value) {
    return function(db, collection, _id, cb) {
      return getCollection(db, collection, function(err, _collection, extra) {
        if (_.isString(_id)) {
          _id = collections[db].ObjectID.createFromHexString(_id);
        }
        return _collection.findOne(_id, function(err, obj) {
          return cb(err, obj[value]);
        });
      });
    };
  };
  getWriters = getValueMaker("_writers");
  getReaders = getValueMaker("_readers");
  getGroups = function(sessionId, db) {
    log("get groups was called");
    return whoami(sessionId, db, function(err, user) {
      return getCollection(db, "user_groups", function(err, userGroups) {
        if (err) {
          log("THERE WAS AN ERROR");
          log(err.message);
        } else {
          log("THERE WAS NO ERROR");
        }
        return userGroups.find({
          userId: user._id
        }, function(err, groups) {
          return cb(err, [user._id].concat(__slice.call(groups.groups)));
        });
      });
    });
  };
  save = function(args, cb) {
    var collection, db, doGetGroups, doGetWriters, doTheSaving, isNew, obj, sessionId;
    db = args.db, collection = args.collection, obj = args.obj, sessionId = args.sessionId;
    isNew = true;
    if ("_id" in obj) {
      isNew = false;
      obj._id = collections[db].ObjectID.createFromHexString(obj._id);
    }
    doTheSaving = function() {
      return getCollection(db, collection, function(err, _collection, extra) {
        if (err) {
          return cb(err);
        }
        return _collection.save(obj, function(err, _obj) {
          return cb(err, _obj);
        });
      });
    };
    doGetWriters = function(cb) {
      if (!isNew) {
        return getWriters(db, collection, obj._id, cb);
      } else {
        return cb(null, ["public"]);
      }
    };
    doGetGroups = function(cb) {
      if (sessionId) {
        return getGroups(sessionId, db, function(err, groups) {
          if (isNew) {
            if (!("_writers" in obj)) {
              obj._writers = [groups[0]];
            }
            if (!("_readers" in obj)) {
              obj._readers = ["public"];
            }
          }
          return cb(err, groups);
        });
      } else {
        return cb(null, ["public"]);
      }
    };
    return parallel([doGetWriters, doGetGroups], function(err, results) {
      var found, groupId, groups, writers, _i, _len;
      writers = results[0], groups = results[1];
      found = false;
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        groupId = groups[_i];
        if (__indexOf.call(writers, groupId) >= 0) {
          found = true;
          doTheSaving();
          break;
        }
      }
      if (!found) {
        return cb({
          message: "no permissions to save",
          groups: groups,
          writers: writers
        });
      }
    });
  };
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
    var saveUser, saveUserGroups;
    saveUser = function(d) {
      return getCollection(db, "users", function(err, users) {
        return users.save({
          username: username,
          password: md5(password)
        }, function(err, user) {
          return d(user);
        });
      });
    };
    saveUserGroups = function(d) {
      return getCollection(db, "user_groups", function(err, userGroups) {
        return userGroups.save({
          userId: user._id,
          groups: []
        }, function(err, group) {
          return d(group);
        });
      });
    };
    return parallel([saveUser, saveUserGroups], function(err, _arg) {
      var groups, user;
      user = _arg[0], groups = _arg[1];
      return cb(err, user);
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
