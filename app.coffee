config = require './config.coffee'
_ = require "underscore"
drews = require("drews-mixins")
mongo = require("mongodb")
nimble = require "nimble"
mongoHost = config.db.host
mongoPort = config.db.port || mongo.Connection.DEFAULT_PORT
crypto = require "crypto"

{wait, trigger, bind, once, log} = _
{series, parallel} = nimble

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

remove = (args, cb) ->
  {db, collection, obj, user} = args
  obj ||= {}
  getCollection db, collection, (err, _collection, extra) ->
    if err then return cb err
    if _.isString obj 
      obj = collections[db].ObjectID.createFromHexString(obj) 
      # obj is now the id
    _collection.remove obj, (err, theArray) ->
      cb err, theArray
 

findOne = (args, cb) ->
  args.oneOrMany = "one"
  find args, cb

find = (args, cb) ->
  {db, collection, obj, oneOrMany, sessionId} = args
  oneOrMany ||= "many"
  obj ||= {}
  getCollection db, collection, (err, _collection, extra) ->
    if err then return cb err
    if _.isString obj
      obj = collections[db].ObjectID.createFromHexString(obj) 
      # obj is now the id
    if oneOrMany == "many"
      _collection.find(obj).toArray (err, theArray) ->
        cb err, theArray
    else
      _collection.findOne obj, (err, _document) ->
        cb err, _document

getValueMaker = (value) ->
  (db, collection, _id, cb) ->
    getCollection db, collection, (err, _collection, extra) ->
      if _.isString _id
        _id = collections[db].ObjectID.createFromHexString(_id) 
      _collection.findOne _id, (err, obj) ->
        #TODO: only get the writers here
        cb err, obj[value]
#TODO: maybe a dependencies table for dependent deletes
getWriters = getValueMaker "_writers"
getReaders = getValueMaker "_readers"
getGroups =  (sessionId, cb) ->
  whoami sessionId, db, (err, user) ->
    getCollection db, "user_groups", (err, userGroups) ->
      userGroups.find userId: user._id, (err, groups) ->
        cb err, [user._id, groups.groups...]
  
save = (args, cb) ->
  {db, collection, obj, sessionId} = args
  isNew = true
  if "_id" of obj
    isNew = false
    obj._id = collections[db].ObjectID.createFromHexString(obj._id) 
  doTheSaving = () ->
    getCollection db, collection, (err, _collection, extra) ->
      if err then return cb err
      _collection.save obj, (err, _obj) ->
        cb err, _obj 

  doGetWriters = (cb) ->
    if not isNew
      getWriters db, collection, obj._id, cb
    else
      cb null, ["public"]
      
  doGetGroups = (cb) ->
    if sessionId
      getGroups sessionId, db, (err, groups) ->
        if isNew
          if "_writers" not of obj
            obj._writers = [groups[0]] #default only you can edit
          if "_readers" not of obj
            obj._readers = ["public"] #default all can see
        cb err, groups
    else
      cb null, ["public"]
  parallel [
    doGetWriters
    doGetGroups
  ], (err, results) ->
    [writers, groups] = results
    found = false
    for groupId in groups
      if groupId in writers
        found = true
        doTheSaving()  
        break
    if not found
      cb
        message: "no permissions to save"
        groups: groups
        writers: writers
        
    

  
      

  

userExists = (db, username, cb) ->
  getCollection db, "users", (err, users) ->
    users.findOne username: username, (err, user) ->
      if user
        cb err, user
      else
        cb err, false
#NOTE: save returns one, insert returns many
createSession = (db, userId, cb) ->
  getCollection db, "sessions", (err, sessions) ->
    sessionId = _.uuid()
    sessions.insert
      userId: userId
      sessionId: sessionId
    , (err, sessions) -> cb err, sessions[0]
deleteSession = (db, userId, cb) ->
  getCollection cb, "sessions", (err, sessions) ->
    sessions.remove
      sessionId: sessionId
    , cb
createUser = (db, username, password, cb) ->
  saveUser = (d) ->
    getCollection db, "users", (err, users) ->
      users.save
        username: username
        password: md5 password
      , (err, user) ->
        d user
  saveUserGroups = (d) ->
    getCollection db, "user_groups", (err, userGroups) ->
      userGroups.save
        userId: user._id
        groups: []
      , (err, group) ->
        d group
  parallel [saveUser, saveUserGroups], (err, [user, groups]) ->
    cb err, user
    
    

md5 = (data) ->
  crypto.createHash('md5').update(data).digest("hex")

authenticateUser = (db, username, password, cb) ->
  getCollection db, "users", (err, users) ->
    users.findOne
      username: username
      password: md5 password
    , (err, user) ->
      if user
        cb err, user
      else
        cb err, false

#needed once for socket connections?
login = (db, username, password, cb) ->
  userExists db, username, (err, user) ->
    if user is false
      createUser db, username, password, (err, user) ->
        createSession db, user._id, (err, session) ->
          cb err, _.extend user, session
    else
      authenticateUser db, username, password, (err, user) ->
        createSession db, user._id, (err, session) ->
          cb err, _.extend user, session

whoami = (sessionId, db, cb) ->
  getCollection db, "sessions", (err, sessions) ->
    sessions.findOne sessionId: sessionId, (err, session) ->
      getCollection db, "users", (err, users) ->
        users.findOne session.userId, (err, user) ->
          cb err, user

  


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


app.post "/:db/:collection", (req, res) ->
  {db, collection} = req.params
  save db, collection, req.body, (err) -> res.send {}
      
false and app.delete "/:db/:collection/:id", (req, res) ->
  {db, collection, id} = req.params
  getCollection db, collection, (err, _collection, extra) ->
    _id = collections[db].ObjectID.createFromHexString(id) 
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
  login
  save
  find
  findOne
  remove
  test
  whoami

}

# soon add web socket rpc that goes the other way
# or events from the server or something like that
# credentails won't be needed for sockets huh?
errorMaker = (error) ->
  (args..., cb) ->
    cb error, null

pg "/rpc", (req, res) ->
  body = req.body
  {method, params, id} = body
  fn = rpcMethods[method] or errorMaker("no such method #{method}")
  fn  params..., (err, result) ->
    res.send
      result: result
      error: err
      id: id

exports.app = app

if (!module.parent) 
  app.listen config.server.port || 8001
  console.log("Express server listening on port %d", app.address().port)

