(function() {
  var app, authenticateUser, bind, clearTests, collections, config, count, createSession, createUser, crypto, db_is_being_opened, deleteSession, doIgotWhatItTakes, drews, drewsSignIn, enableCORS, errorMaker, express, find, findOne, getCollection, getGroups, getReaderWriterMaker, getReaders, getWriters, log, login, md5, mongo, mongoHost, mongoPort, mongoServer, nimble, once, parallel, pg, remove, removeCollection, removeCollectionMaker, rpcMethods, save, series, test, trigger, userExists, wait, whoami, _;
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
  getCollection = function() {
    var args, cacheCollection, cachedCollection, cb, collection, db, debug, getDb, gettingDb, giveCollection, haveCollection, mayHaveDb, startGettingCollection, startGettingDb, _i;
    args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
    if (cb == null) {
      cb = function() {};
    }
    db = args[0], collection = args[1], debug = args[2];
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
      if (debug) {
        log("starting to get db " + db);
      }
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
      if (debug) {
        log("starting to get collection " + collection);
      }
      return getDb().collection(collection, function(err, _collection) {
        if (debug) {
          log("got collection " + collection);
        }
        cacheCollection(_collection);
        return cb(err, _collection, collections[db]);
      });
    };
    count++;
    giveCollection = function() {
      if (haveCollection()) {
        if (debug) {
          log("giving colleciton " + collection);
        }
        return cb(null, cachedCollection(), collections[db]);
      } else {
        if (debug) {
          log("you don't have collection " + collection + ", start getting it");
        }
        return startGettingCollection();
      }
    };
    if (mayHaveDb()) {
      if (gettingDb()) {
        if (debug) {
          log("you are getting db " + db);
        }
        return once(collections[db], "gotten", function() {
          if (debug) {
            log("got db now start with colleciton " + collection);
          }
          return giveCollection();
        });
      } else {
        if (debug) {
          log("you have db " + db + ". now get and give the collection");
        }
        return giveCollection();
      }
    } else {
      if (debug) {
        log("you don't have db, " + db + ", start getting it");
      }
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
  wait(5000, function() {
    var get1, get2;
    get1 = function(cb) {
      return getCollection("severus_the_tl", "users", function(err, users) {
        log("got users parallel");
        return cb(null, "the users");
      });
    };
    get2 = function(cb) {
      return getCollection("severus_the_tl", "user_groups", function(err, users) {
        log("got usergroups parallel ");
        return cb(null, "the groups");
      });
    };
    return parallel([get1, get2], function(err, results) {
      return log(results);
    });
  });
  doIgotWhatItTakes = function(acceptable, whatIGot) {
    var found, item, _i, _len;
    found = false;
    for (_i = 0, _len = whatIGot.length; _i < _len; _i++) {
      item = whatIGot[_i];
      if (__indexOf.call(acceptable, item) >= 0) {
        found = true;
        return true;
      }
    }
    return false;
  };
  remove = function(args, cb) {
    var collection, db, obj, sessionId, single, user, _id;
    log("removing");
    db = args.db, collection = args.collection, obj = args.obj, user = args.user, sessionId = args.sessionId;
    single = false;
    if (_.isString(obj)) {
      single = true;
      _id = obj;
      obj = {};
      obj._id = collections[db].ObjectID.createFromHexString(_id);
    }
    obj || (obj = {});
    return getGroups(sessionId, db, function(err, groups) {
      return getCollection(db, collection, function(err, _collection, extra) {
        var doRemoving;
        doRemoving = function() {
          obj._writers = {
            "$in": groups
          };
          return _collection.remove(obj, function(err, ret) {
            return cb(err, ret);
          });
        };
        if (err) {
          return cb(err);
        }
        if (single) {
          log("the single obj is");
          log(obj);
          return _collection.findOne(obj, function(err, obj) {
            if (!doIgotWhatItTakes(obj.writers, groups)) {
              return cb("You don't have permission to delete that record");
            } else {
              return doRemoving();
            }
          });
        } else {
          return doRemoving();
        }
      });
    });
  };
  findOne = function(args, cb) {
    args.oneOrMany = "one";
    return find(args, cb);
  };
  find = function(args, cb) {
    var collection, db, obj, oneOrMany, sessionId, _id;
    db = args.db, collection = args.collection, obj = args.obj, oneOrMany = args.oneOrMany, sessionId = args.sessionId;
    oneOrMany || (oneOrMany = "many");
    if (_.isString(obj)) {
      _id = obj;
      obj = {};
      obj._id = collections[db].ObjectID.createFromHexString(_id);
    }
    obj || (obj = {});
    return getGroups(sessionId, db, function(err, groups) {
      obj._readers = {
        "$in": groups
      };
      return getCollection(db, collection, function(err, _collection, extra) {
        if (err) {
          return cb(err);
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
    });
  };
  getReaderWriterMaker = function(value) {
    return function(db, collection, _id, cb) {
      if (!_id) {
        return cb(null, ["public"]);
      } else {
        return getCollection(db, collection, function(err, _collection, extra) {
          if (_.isString(_id)) {
            _id = collections[db].ObjectID.createFromHexString(_id);
          }
          return _collection.findOne(_id, function(err, obj) {
            return cb(err, obj[value]);
          });
        });
      }
    };
  };
  getWriters = getReaderWriterMaker("_writers");
  getReaders = getReaderWriterMaker("_readers");
  getGroups = function(sessionId, db, cb) {
    if (sessionId) {
      return whoami(sessionId, db, function(err, user) {
        return getCollection(db, "user_groups", function(err, userGroups) {
          return userGroups.findOne({
            userId: user._id
          }, function(err, groups) {
            return cb(err, [user._id].concat(__slice.call(groups.groups)));
          });
        });
      });
    } else {
      return cb(null, ['public']);
    }
  };
  save = function(args, cb) {
    var collection, db, debug, doTheSaving, groups, isNew, obj, sessionId;
    db = args.db, collection = args.collection, obj = args.obj, sessionId = args.sessionId;
    if (obj.name.match(/Javiera/i)) {
      debug = true;
      log(obj);
    }
    debug = true;
    isNew = true;
    if ("_id" in obj) {
      isNew = false;
      obj._id = collections[db].ObjectID.createFromHexString(obj._id);
    }
    groups = null;
    doTheSaving = function() {
      if (isNew && sessionId) {
        if (!("_writers" in obj)) {
          obj._writers = [groups[0]];
        }
      }
      if (isNew && !sessionId) {
        if (!("_writers" in obj)) {
          obj._writers = ["public"];
        }
      }
      if (!("_readers" in obj)) {
        obj._readers = ["public"];
      }
      if (debug) {
        log("doing the saving");
        log(obj);
      }
      return getCollection(db, collection, function(err, _collection, extra) {
        if (err) {
          return cb(err);
        }
        return _collection.save(obj, function(err, _obj) {
          return cb(err, _obj);
        });
      });
    };
    return parallel([
      function(cb) {
        return getWriters(db, collection, obj._id, cb);
      }, function(cb) {
        return getGroups(sessionId, db, cb);
      }
    ], function(err, results) {
      var writers;
      if (debug) {
        log("the results are");
        log(results);
      }
      writers = results[0], groups = results[1];
      if (doIgotWhatItTakes(writers, groups)) {
        return doTheSaving();
      } else {
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
          return d(null, user);
        });
      });
    };
    saveUserGroups = function(user, d) {
      return getCollection(db, "user_groups", function(err, userGroups) {
        return userGroups.save({
          userId: user._id,
          groups: ["public"]
        }, function(err, group) {
          return d(group);
        });
      });
    };
    return series([saveUser, saveUserGroups], function(err, _arg) {
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
          log("user created");
          log(user);
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
  removeCollectionMaker = function(db, collection) {
    return function(cb) {
      return removeCollection(db, collection, function(err) {
        return cb();
      });
    };
  };
  removeCollection = function(db, collection, cb) {
    return getCollection(db, collection, function(err, _coll) {
      return _coll.remove(function(err) {
        return cb(err);
      });
    });
  };
  clearTests = function(cb) {
    var db;
    db = "severus_drewl_us";
    return parallel([removeCollectionMaker(db, "users"), removeCollectionMaker(db, "user_groups"), removeCollectionMaker(db, "bands")], function(err) {
      return cb(err, "test collecitons cleared");
    });
  };
  rpcMethods = {
    login: login,
    save: save,
    find: find,
    findOne: findOne,
    remove: remove,
    test: test,
    whoami: whoami,
    clearTests: clearTests
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
