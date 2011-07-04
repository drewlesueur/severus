(function() {
  var $, drews, eq, log, nimble, series, severus, _;
  $ = require("jquery");
  severus = require("severus");
  _ = require("underscore");
  nimble = require("nimble");
  drews = require("drews-mixins");
  log = _.log;
  eq = drews.assertEqual;
  series = nimble.series;
  $(function() {
    var band, find, id, login, remove, save, serv, tests;
    save = severus.save, find = severus.find, remove = severus.remove, login = severus.login, serv = severus.serv;
    band = {
      name: "Aterciopelados",
      cd: ["Caribe Atomico", "Rio"]
    };
    id = null;
    tests = [
      function(d) {
        return d();
      }, function(d) {
        return remove("bands", function(err, result) {
          return find("bands", function(err, results) {
            eq(results.length, 0, "removing should give us no results");
            return save("bands", band, function(err, result) {
              eq(result.length, 1, "length should be 1");
              eq(result[0].name, "Aterciopelados");
              band = result[0];
              return find("bands", function(err, results) {
                eq(results[0].name, "Aterciopelados");
                band.concerts = ["Colombia", "California"];
                return d();
              });
            });
          });
        });
      }, function(d) {
        return save("bands", {
          name: "Julieta Venegas",
          age: 40,
          songs: ["me voy", "otra cosa"]
        }, function(err, reslut) {
          return find("bands", {
            age: 40
          }, function(err, results) {
            eq(results[0].age, 40, "should get age");
            return d();
          });
        });
      }, function(d) {
        return remove("bands", function(err) {
          band = {
            name: "choc quib town",
            albums: ["oro"]
          };
          return save("bands", band, function(err, bands) {
            band = bands[0];
            band.members = ["goyo", "tostao", "slow"];
            return save("bands", band, function(err) {
              return find("bands", function(err, bands) {
                eq(bands.length, 1, "saving should overwrite");
                return d();
              });
            });
          });
        });
      }, function(d) {
        return login("drew", "passw0rd", function(err, user) {
          var sessionId;
          log(user);
          sessionId = user.sessionId;
          eq(user.username, "drew", "username should match");
          return serv("whoami", function(err, user) {
            eq(err, null);
            log(err);
            eq(user.username, "drew", "whoami should work");
            return d();
          });
        });
      }
    ];
    return series(tests, function() {
      return log("" + (drews.getPassCount()) + "/" + (drews.getAssertCount()) + " assertions passed\n" + (drews.getFailedMessages()));
    });
  });
  /*
    server "save", "severus_drewl_us", "test"
      name: "Drew"
      song: "ecos de canto llegan al sol"
    , (err, data) ->
      log data
  
    server "find", "severus_drewl_us", "test", (err, data) ->
      log data
    server "remove", "severus_drewl_us", "test", (err, data) ->
      log data
  
  */
}).call(this);
