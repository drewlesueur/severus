config = require './config.coffee'
_ = require "underscore"
drews = require("drews-mixins")
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

enableCORS = (req, res, next) ->
  res.setHeader "Access-Control-Allow-Origin", "*"
  next()


app = module.exports = express.createServer()
app.configure () ->
  app.use enableCORS
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
    if gettingDb()
      once collections[db], "gotten", startGettingCollection
    else if haveCollection()
      cb null, cachedCollection(), collections[db]
    else
      startGettingCollection()
  else
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
findOne = (db, collection, _id, cb) ->
  find db, collection, _id, "one", cb

find = (args..., cb) ->
  log "the args are #{args}"
  [db, collection, wheres, oneOrMany] = args
  log "the collection is #{collection}"
  oneOrMany ||= "many"
  wheres ||= {}
  getCollection db, collection, (err, _collection, extra) ->
    if err then return cb err
    if _.isString wheres 
      wheres = extra.ObjectID.createFromHexString(wheres) 
      # wheres is now the id
    if oneOrMany == "many"
      _collection.find(wheres).toArray (err, theArray) ->
        cb err, theArray
    else
      _collection.findOne wheres, (err, _document) ->
        cb err, _document

  
app.get "/:db/:collection/:id", (req, res) ->
  {db, collection, id} = req.params
  find db, collection, {_id: id}, (err, _document) ->
    res.send _document

app.get "/:db/:collection", (req, res) ->
  {db, collection} = req.params
  find db, collection, (err, _array) ->
    res.send _array

  getCollection db, collection, (err, _collection) ->
    if err
      return log "error"
    _collection.find().toArray (err, theArray) ->
      res.send theArray

save = (db, collection, obj, cb) ->
  getCollection db, collection, (err, _collection, extra) ->
    if err then return cb err
    _collection.insert obj, (err, _objs) ->
      cb err, _objs 
app.post "/:db/:collection", (req, res) ->
  {db, collection} = req.params
  save db, collection, req.body, (err) -> res.send {}
      
false and app.delete "/:db/:collection/:id", (req, res) ->
  {db, collection, id} = req.params
  getCollection db, collection, (err, _collection, extra) ->
    _id = ObjectID.createFromHexString(id) 
    _collection.remove _id: _id, (err) ->
      res.send {}



app.get "/drew", (req, res) ->
  res.send "aguzate, hazte valer"




pg "/p", (req, res) ->
  req.session.poo = "gotta"
  res.send "that is all"

pg "/whoami", (req, res) ->
  res.send req.session
  
test = (a, b..., cb) ->
  cb null, yo: "#{a} yo"

rpcMethods = {
  save
  find
  test
}

# soon add web socket rpc that goes the other way
# or events from the server or something like that
pg "/rpc", (req, res) ->
  body = req.body
  {method, params, id} = body
  log method, params, id
  log rpcMethods[method]
  rpcMethods[method] params..., (err, result) ->
    res.send
      result: result
      error: err
      id: id

exports.app = app

if (!module.parent) 
  app.listen config.server.port || 8001
  console.log("Express server listening on port %d", app.address().port)

