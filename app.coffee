config = require './config.coffee'
_ = require "underscore"
require("drews-mixins") _
mongo = require("mongodb")
mongoHost = config.db.host
mongoPort = config.db.port || mongo.Connection.DEFAULT_PORT

{wait, trigger, bind, once} = _

log = (args...) -> console.log args... 

express = require('express')

drewsSignIn = (req, res, next) ->
  req.isSignedIn = () ->
    req.session.email isnt null
  next()

app = module.exports = express.createServer()
app.configure () ->
  app.use(express.bodyParser())
  app.use express.cookieParser()
  app.use express.session secret: "boom shaka laka"
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
  app.use drewsSignIn

app.configure 'development', () ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })) 

app.configure 'production', () ->
  app.use(express.errorHandler()) 


pg = (p, f) ->
  app.post p, f
  app.get p, f




# Routes



count = 0
mongoServer = new mongo.Server mongoHost, mongoPort, {}
collections = {}
getCollection = (db, collection, cb=->) ->
  # the riff raff here is because
  # db.open's callback only gets called once
  mayHaveDb = -> db of collections
  gettingDb = -> collections[db].state == "getting"
  haveCollection = -> collection of collections[db].cns
  cachedCollection = -> collections[db].cns[collection]
  getDb = -> collections[db].db
  cacheCollection = (c) -> collections[db].cns[collection] = c
  startGettingDb = ->
    dbBig = new mongo.Db db, mongoServer, {}
    collections[db] = {}
    collections[db].state = "getting"
    collections[db].db = dbBig
    collections[db].cns = {}
    dbBig.open (err, _db) ->

      ObjectID = dbBig.bson_serializer.ObjectID
      collections[db].ObjectID = ObjectID 
      collections[db].db = _db
      collections[db].state = "gotten"
      trigger collections[db], "gotten"
      startGettingCollection()
  startGettingCollection = ->
    getDb().collection collection, (err, _collection) ->
      cacheCollection _collection
      cb err, _collection, collections[db]
  count++  
  if mayHaveDb()
    log "may have db #{count}"
    if gettingDb()
      log "getting db #{count}"
      once collections[db], "gotten", startGettingCollection
    else if haveCollection()
      log "log have colleciton #{count}"
      cb null, cachedCollection(), collections[db]
    else
      log "not getting nor have collection #{count}"
      startGettingCollection()
  else
    log "dont have and not getting db #{count}"
    startGettingDb()
    


  

getCollection "office_test", "listings", (err, c) ->
  c.find().toArray (err, _docs) ->
    #console.log _docs
    log """
    separator
    """
getCollection "office_test", "listings", (err, c) ->
  c.find().toArray (err, _docs) ->
    #console.log _docs
    log """
    separator
    """
getCollection "office_test", "listings", (err, c) ->
  c.find().toArray (err, _docs) ->
    #console.log _docs
    log """
    separator
    """
  
app.get "/:db/:collection/:id", (req, res) ->
  {db, collection, id} = req.params
  getCollection db, collection, (err, _collection, extra) ->
    _id = extra.ObjectID.createFromHexString(id) 
    _collection.findOne _id, (err, _document) ->
      res.send _document

app.get "/:db/:collection", (req, res) ->
  log "this is ok"
  {db, collection} = req.params
  getCollection db, collection, (err, _collection) ->
    log "got hizzle"
    if err
      return log "error"
    _collection.find().toArray (err, theArray) ->
      res.send theArray

false and app.post "/:db/:collection", (req, res) ->
  {db, collection} = req.params
  getCollection db, collection, (err, _collection) ->
    _collection.insert req.body, (err) ->
      res.send {}
      
false and app.delete "/:db/:collection/:id", (req, res) ->
  {db, collection, id} = req.params
  _id = ObjectID.createFromHexString(id) 
  getCollection db, collection, (err, _collection) ->
    _collection.remove _id: _id, (err) ->
      res.send {}



app.get "/drew", (req, res) ->
  res.send "aguzate, hazte valer"




pg "/p", (req, res) ->
  req.session.poo = "gotta"
  res.send "that is all"

pg "/whoami", (req, res) ->
  res.send req.session
  


exports.app = app

if (!module.parent) 
  app.listen config.server.port || 8001
  console.log("Express server listening on port %d", app.address().port)

