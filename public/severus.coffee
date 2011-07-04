define "severus", () ->
  _ = require "underscore"
  drews = require("drews-mixins")
  nimble = require "nimble"
  server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/")
  {extend, log} = _
  self = {}
  self.db = "severus_drewl_us"
  credentials = {}
  self.credentials = credentials

  serverCallMaker = (call)  ->
    (args..., cb) ->
      [collection, obj, extra] = args
      extra ||= {}
      args =
        db: self.db
        collection: collection
        obj: obj 
      extend args, extra
      server call, args, cb

  save = serverCallMaker "save"
  find = serverCallMaker "find"
  remove = serverCallMaker "remove"

  _.extend self, {save, find, remove}


  
  
