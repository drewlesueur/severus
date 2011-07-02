(function() {
  var app, bind, collections, config, count, drewsSignIn, enableCORS, express, getCollection, log, mongo, mongoHost, mongoPort, mongoServer, once, pg, rpcMethods, trigger, wait, _;
  var __slice = Array.prototype.slice;
  config = require('./config.coffee');
  _ = require("underscore");
  require("drews-mixins")(_);
  mongo = require("mongodb");
  mongoHost = config.db.host;
  mongoPort = config.db.port || mongo.Connection.DEFAULT_PORT;
  wait = _.wait, trigger = _.trigger, bind = _.bind, once = _.once;
  log = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, args);
  };
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
  rpcMethods = {
    test: function(a, b, cb) {
      return cb(null, {
        yo: "hello world " + a
      });
    },
    testError: function(cb) {
      return cb({
        yo: "there was an error"
      });
    }
  };
  app.get("/rpc", function(req, res) {
    var body, id, method, params;
    body = req.body;
    method = body.method, params = body.params, id = body.id;
    return rpcMethods[method].apply(rpcMethods, __slice.call(params).concat([function(err, result) {
      return res.send({
        result: result,
        error: err,
        id: id
      });
    }]));
  });
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
      log("may have db " + count);
      if (gettingDb()) {
        log("getting db " + count);
        return once(collections[db], "gotten", startGettingCollection);
      } else if (haveCollection()) {
        log("log have colleciton " + count);
        return cb(null, cachedCollection(), collections[db]);
      } else {
        log("not getting nor have collection " + count);
        return startGettingCollection();
      }
    } else {
      log("dont have and not getting db " + count);
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
  app.get("/:db/:collection/:id", function(req, res) {
    var collection, db, id, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection, id = _ref.id;
    return getCollection(db, collection, function(err, _collection, extra) {
      var _id;
      _id = extra.ObjectID.createFromHexString(id);
      return _collection.findOne(_id, function(err, _document) {
        return res.send(_document);
      });
    });
  });
  app.get("/:db/:collection", function(req, res) {
    var collection, db, _ref;
    log("this is ok");
    _ref = req.params, db = _ref.db, collection = _ref.collection;
    return getCollection(db, collection, function(err, _collection) {
      log("got hizzle");
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
    return getCollection(db, collection, function(err, _collection, extra) {
      var _id;
      _id = extra.ObjectID.createFromHexString(id);
      return _collection.insert(req.body, function(err) {
        return res.send({});
      });
    });
  });
  false && app["delete"]("/:db/:collection/:id", function(req, res) {
    var collection, db, id, _ref;
    _ref = req.params, db = _ref.db, collection = _ref.collection, id = _ref.id;
    return getCollection(db, collection, function(err, _collection, extra) {
      var _id;
      _id = ObjectID.createFromHexString(id);
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
  exports.app = app;
  if (!module.parent) {
    app.listen(config.server.port || 8001);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
