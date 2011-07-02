(function() {
  var $, drews, log, sev, _;
  $ = require("jquery");
  sev = require("severus");
  _ = require("underscore");
  drews = require("drews-mixins");
  log = _.log;
  $(function() {
    var server;
    server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/");
    /*
      server "test", 1, 2, 3, (err, result) ->
        log result
      log "tried"
    
      server "save", "severus_drewl_us", "test"
        name: "Drew"
        song: "ecos de canto llegan al sol"
      , (err, data) ->
        log data
      */
    return server("find", "severus_drewl_us", "test", function(err, data) {
      return log(data);
    });
  });
}).call(this);
