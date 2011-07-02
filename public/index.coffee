$ = require "jquery"
sev = require "severus"
_ = require "underscore"
drews = require "drews-mixins"

{log} = _

$ ->
  server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/")

  ###
  server "test", 1, 2, 3, (err, result) ->
    log result
  log "tried"

  server "save", "severus_drewl_us", "test"
    name: "Drew"
    song: "ecos de canto llegan al sol"
  , (err, data) ->
    log data
  ###

  server "find", "severus_drewl_us", "test", (err, data) ->
    log data





