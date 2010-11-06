(function() {
  var Auth, MyTest, app, express, form, fs, get_post, handle_methods, handle_s_methods, host, mongo, port, request;
  var __hasProp = Object.prototype.hasOwnProperty;
  require("./secret.coffee");
  request = require("request");
  this.request = request;
  mongo = require("mongodb");
  host = 'localhost';
  port = mongo.Connection.DEFAULT_PORT;
  Auth = require("auth");
  fs = require("fs");
  require("./underscore");
  require("./util");
  require("./util2.coffee");
  form = require("connect-form");
  express = require("express");
  app = express.createServer();
  MyTest = function(req, res, next) {
    req.party = "have a party";
    res.party = "have a double time party";
    if (!req.session.officelist) {
      req.session.officelist = {};
    }
    req.user = function() {
      if (req.session.officelist.userdomain && req.session.officelist.userid) {
        return req.session.officelist.userdomain + ":" + req.session.officelist.userid;
      } else {
        return "";
      }
    };
    return next();
  };
  app.configure(function() {
    app.set("root", __dirname);
    app.set('views', __dirname + '/views');
    app.use(express.staticProvider("public"));
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(express.cookieDecoder());
    app.use(express.session({
      lifetime: (150).seconds,
      reapInterval: (10).seconds
    }));
    app.use(Auth([Auth.Anonymous(), Auth.Never(), Auth.Twitter(twitter_config)]));
    app.use(MyTest);
    return app.use(form({
      keepExtensions: true
    }));
  });
  this.ObjectID = mongo.BSONPure.ObjectID;
  this.db = new mongo.Db('mydb', new mongo.Server(host, port, {}), {});
  require("./methods");
  require("./s_methods");
  app.get("/test", function(req, res) {
    return res.send("toquemen el bombo");
  });
  handle_methods = function(req, res, args) {
    var method;
    method = req.param("method");
    args = decodeURIComponent(args.q);
    return methods[method](JSON.parse(args), req, res);
  };
  handle_s_methods = function(req, res, args) {
    var _a, key, method, new_args, val;
    method = req.param("method");
    new_args = {};
    _a = args;
    for (key in _a) {
      if (!__hasProp.call(_a, key)) continue;
      val = _a[key];
      new_args[key] = parse_slon(val);
    }
    return s_methods[method](new_args, req, res);
  };
  this.db.open(function() {
    app.post("/:method", function(req, res) {
      return req.param("method") in methods ? handle_methods(req, res, req.body) : null;
    });
    app.get("/:method", function(req, res) {
      return req.param("method") in methods ? handle_methods(req, res, req.query) : null;
    });
    app.get("/s.:method", function(req, res) {
      return req.param("method") in s_methods ? handle_s_methods(req, res, req.query) : console.log("not there");
    });
    app.post("/:collection", function(req, res) {
      var args, collection;
      collection = req.param("collection");
      args = JSON.parse(decodeURIComponent(req.body.model));
      args._type = collection;
      return methods.insert(args, req, res);
    });
    app.get("/:collection", function(req, res) {
      var args, collection;
      collection = req.param("collection");
      args = {
        _type: collection
      };
      return methods.find(args, req, res);
    });
    app.get("/:collection/:id", function(req, res) {
      var args;
      args = {
        _type: req.param("collection"),
        _id: req.param("id")
      };
      return methods.find(args, req, res);
    });
    app.put("/:collection/:id", function(req, res) {
      var args;
      args = {
        _type: req.param("collection")({
          va: JSON.parse(decodeURIComponent(req.body.model)),
          wh: {
            _id: req.param("id")
          }
        })
      };
      return methods.update(args, req, res);
    });
    return app["delete"]("/:collection/:id", function(req, res) {
      var args;
      args = {
        _type: req.param("collection"),
        _id: req.param("id")
      };
      return methods.remove(args, req, res);
    });
  });
  get_post = function(path, func) {
    app.post(path, func);
    return app.get(path, func);
  };
  get_post("/me", function(req, res) {
    return res.send({
      username: req.user()
    });
  });
  app.post("/upload-image", function(req, res) {
    return req.form.complete(function(err, fields, files) {
      var file_name, output_file;
      if (err) {
        res.send("error");
      }
      if (files) {
        file_name = files.myfile.path.split("/");
        file_name = _.s(file_name, -1)[0];
        output_file = ("public/images/thumbs/" + (file_name));
        return exec("convert " + (files.myfile.path) + " -resize 50x50 " + (output_file), function(err, stdin, stdout) {
          var medium_output_file;
          medium_output_file = ("public/images/medium/" + (file_name));
          return exec("convert " + (files.myfile.path) + " -resize 450x450 " + (medium_output_file), function(err, stdin, stdout) {
            return res.send(_.s(file_name));
          });
        });
      }
    });
  });
  app.get("/json", function(req, res) {
    return res.send({
      test: "json",
      really: "cool"
    });
  });
  app.get("/", function(req, res) {
    var username;
    if (req.isAuthenticated()) {
      username = req.getAuthDetails().user.username;
    } else {
      username = "none";
    }
    return res.send(req.user());
  });
  app.get('/auth/:auth_strategy', function(req, res, params) {
    var authentication_strategy;
    authentication_strategy = req.params.auth_strategy;
    console.log(authentication_strategy);
    return req.authenticate([authentication_strategy], function(error, authenticated) {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      if (authenticated) {
        req.session.officelist.userdomain = authentication_strategy;
        if (authentication_strategy === "twitter") {
          req.session.officelist.userid = req.getAuthDetails().user.user_id;
        } else if (authentication_strategy === "anon") {
          req.session.officelist.userid = req.getAuthDetails().user.username;
        }
        return res.redirect("/");
      } else {
        return res.redirect("/");
      }
    });
  });
  app.get('/coffee/:name.js', function(req, res) {
    return exec("coffee -c public/js/" + req.params.name + '.coffee', function(error, stdout, stderr) {
      if (error) {
        1 === 1;
      }
      return fs.chmod('public/js/' + req.params.name + '.js', parseInt("777", 8), function() {
        return res.sendfile('public/js/' + req.params.name + '.js');
      });
    });
  });
  app.get("/logout", function(req, res, params) {
    req.logout();
    return res.redirect("/");
  });
  exports.run = function() {
    return app.listen(parseInt(process.env.PORT || 86), null);
  };
})();
