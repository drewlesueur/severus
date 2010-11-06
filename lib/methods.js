(function() {
  var find, insert, log_in_the_user, login, update;
  insert = function(args, req, res) {
    return db.collection(args._type || "things", function(err, collection) {
      if (err) {
        console.log(err);
        return res.send("error with insert");
      } else {
        delete args._type;
        args._user = req.user();
        delete args._id;
        return collection.insert(args, function(err, docs) {
          var _a, _b, _c, _d, doc;
          if (err) {
            console.log(err);
            res.send("super error");
          }
          _a = []; _c = docs;
          for (_b = 0, _d = _c.length; _b < _d; _b++) {
            doc = _c[_b];
            _a.push(res.send(doc._id));
          }
          return _a;
        });
      }
    });
  };
  update = function(args, req, res) {
    return db.collection(args._type || "things", function(err, collection) {
      if (err) {
        console.log(err);
        return res.send("broke");
      } else {
        args.wh._user = req.user();
        if ("_id" in args.va) {
          delete args.va._id;
        }
        if ("_id" in args.wh) {
          args.wh._id = ObjectID.createFromHexString(args.wh._id);
        }
        return collection.update(args.wh, args.va, {
          upsert: args.upsert || false,
          multi: args.multi || false
        }, function(err, wha) {
          return res.send(args.wh._id);
        });
      }
    });
  };
  find = function(args, req, res) {
    return db.collection(args._type || "things", function(err, collection) {
      if (err) {
        console.log(err);
        return res.send("error with find");
      } else {
        try {
          delete args._type;
          if ("_id" in args) {
            args._id = ObjectID.createFromHexString(args.wh._id);
          }
          args["$where"] = ("(this._user == '" + (req.user()) + "' || this._public == true)");
          return collection.find(args, function(err, cursor) {
            return cursor.toArray(function(err, docs) {
              return res.send(docs);
            });
          });
        } catch (e) {
          return res.send(e);
        }
      }
    });
  };
  log_in_the_user = function(req, username) {
    req.session.officelist.userdomain = "severus";
    req.session.officelist.userid = username;
    return null;
  };
  login = function(args, req, res) {
    return db.collection("users", function(err, collection) {
      if (err) {
        return res.send("error with finding users");
      } else {
        console.log("trying to log in!!");
        return collection.find({
          username: args.username
        }, function(err, cursor) {
          return cursor.toArray(function(err, docs) {
            var record;
            record = docs[0];
            if (!record) {
              return collection.insert(args, function(err, docs) {
                if (err) {
                  res.send({
                    result: "there was some kind of error trying to add"
                  });
                  return null;
                }
                log_in_the_user(req, args.username);
                res.send({
                  result: true
                });
                return null;
              });
            } else {
              if ("password" in record && record.password === args.password) {
                log_in_the_user(req, args.username);
                res.send({
                  result: true
                });
                return null;
              } else {
                return res.send({
                  result: false
                });
              }
            }
          });
        });
      }
    });
  };
  this.methods = {
    login: login,
    test2: function(args, req, res) {
      return res.send("a ute latanbora");
    },
    insert: insert,
    find: find,
    update: update,
    remove: function(args, req, res) {
      return db.collection(args._type || "things", function(err, collection) {
        if (err) {
          return res.send("broke");
        } else {
          args._user = req.user();
          if ("_id" in args) {
            args._id = ObjectID.createFromHexString(args._id);
          }
          return collection.remove(args, function(err, collection) {
            return res.send("done");
          });
        }
      });
    },
    test: function() {
      return console.log("test");
    },
    addedit: function(args, req, res) {
      console.log("got to add edit");
      return db.collection(args._type || "things", function(err, collection) {
        var orig_args;
        if (err) {
          return res.send("addedit error");
        } else {
          try {
            if ("_id" in args) {
              orig_args = args;
              args = {};
              args.wh = {};
              args.wh._id = orig_args._id;
              delete orig_args._id;
              args.va = orig_args;
              args._type = orig_args._type;
              return update(args, req, res);
            } else {
              return insert(args, req, res);
            }
          } catch (e) {
            return res.send(e);
          }
        }
      });
    }
  };
})();
