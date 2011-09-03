#TODO: add a special property that only super admin can edit
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
  res.setHeader "Access-Control-Allow-Headers", "Content-Type, X-Requested-With"
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
db_is_being_opened = false
getCollection = (args...,  cb=->) ->
  [db, collection, debug] = args
  
  # the riff raff here is because
  # db.open's callback only gets called once
  # also because only one can be 'being opened' at a time?
  mayHaveDb = -> db of collections
  gettingDb = -> collections[db].state == "getting"
  haveCollection = -> collection of collections[db].cns
  cachedCollection = -> collections[db].cns[collection]
  getDb = -> collections[db].db
  cacheCollection = (c) -> collections[db].cns[collection] = c
  startGettingDb = ->
    if debug then log "starting to get db #{db}"
    collections[db] ||= {}
    collections[db].state = "getting"
    if db_is_being_opened
      return wait 500, () ->
        return startGettingDb()
      return
    db_is_being_opened = true
    dbBig = new mongo.Db db, mongoServer, {}
    collections[db].db = dbBig
    collections[db].cns = {}
    dbBig.open (err, _db) ->
      db_is_being_opened = false
      ObjectID = dbBig.bson_serializer.ObjectID
      collections[db].ObjectID = ObjectID 
      collections[db].db = _db
      collections[db].state = "gotten"
      trigger collections[db], "gotten"
      startGettingCollection()
  startGettingCollection = ->
    if debug then log "starting to get collection #{collection}"
    getDb().collection collection, (err, _collection) ->
      if debug then log "got collection #{collection}"
      cacheCollection _collection
      cb err, _collection, collections[db]
  count++  
  giveCollection = () ->
    if haveCollection()
      if debug then log "giving colleciton #{collection}"
      cb null, cachedCollection(), collections[db] 
    else
      if debug then log "you don't have collection #{collection}, start getting it"
      startGettingCollection()
  if mayHaveDb()
    if gettingDb()
      if debug then log "you are getting db #{db}"
      once collections[db], "gotten", () ->
        if debug then log "got db now start with colleciton #{collection}"
        giveCollection()
    else
      if debug then log "you have db #{db}. now get and give the collection"
      giveCollection()
  else
    if debug then log "you don't have db, #{db}, start getting it"
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
getCollection "office_test", "listings_groups", (err, c) ->
  c.find().toArray (err, _docs) ->
    #console.log _docs
    log """
    separator groups
    """
getCollection "severus_the_tl", "users", (err, users) ->
  log "Should only be here once"
getCollection "severus_the_tl", "user_groups", (err, users) ->
  log "this once too"

getCollection "office_test", "listings_groups", (err, c) ->
  c.find().toArray (err, _docs) ->
    #console.log _docs
    log """
    separator groups again
    """

wait 5000, ->
  get1 = (cb) ->
    getCollection "severus_the_tl", "users", (err, users) ->
      log "got users parallel"
      cb null, "the users"
  get2 = (cb) ->
    getCollection "severus_the_tl", "user_groups", (err, users) ->
      log "got usergroups parallel "
      cb null, "the groups"
  parallel [get1, get2], (err, results) ->
    log results 


doIgotWhatItTakes = (acceptable, whatIGot) ->
  found = false
  for item in whatIGot
    if item in acceptable
      found = true
      return true  
  return false


remove = (args, cb) ->
  #TODO: write test for removing being the first thing done
  log "removing"
  {db, collection, obj, user, sessionId} = args
  getGroups sessionId, db, (err, groups) ->
    getCollection db, collection, (err, _collection, extra) ->
      single = false
      if _.isString obj 
        single = true
        _id = obj
        obj = {}
        obj._id = collections[db].ObjectID.createFromHexString(_id) 
      obj ||= {}
      doRemoving = () ->
        obj._writers = {"$in": groups}
        _collection.remove obj, (err, ret) ->
          cb err, ret
      if err then return cb err
        # obj is now the id
      if single
        log "the single obj is"
        log obj
        _collection.findOne obj, (err, obj) ->
          #TODO: test removingone
          log "the obj is"
          log obj
          log "the groups are"
          log groups
          log "the writers are"
          log obj._writers
          if not doIgotWhatItTakes obj._writers, groups
            return cb "You don't have permission to delete that record"
          else
            doRemoving()
      else
        doRemoving()
 

findOne = (args, cb) ->
  args.oneOrMany = "one"
  find args, cb

find = (args, cb) ->
  {db, collection, obj, oneOrMany, sessionId} = args
  oneOrMany ||= "many"
  if _.isString obj 
    _id = obj
    obj = {}
    obj._id = collections[db].ObjectID.createFromHexString(_id) 
  obj ||= {}
  getGroups sessionId, db, (err, groups) ->
    obj._readers = {"$in": groups}
    getCollection db, collection, (err, _collection, extra) ->
      if err then return cb err
      if oneOrMany == "many"
        _collection.find(obj).toArray (err, theArray) ->
          cb err, theArray
      else
        _collection.findOne obj, (err, _document) ->
          cb err, _document

getReaderWriterMaker = (value) ->
  (db, collection, _id, cb) ->
    if not _id
      cb null, ["public"]
    else
      getCollection db, collection, (err, _collection, extra) ->
        if _.isString _id
          _id = collections[db].ObjectID.createFromHexString(_id) 
        _collection.findOne _id, (err, obj) ->
          #TODO: only get the writers here
          cb err, obj[value]
#TODO: maybe a dependencies table for dependent deletes
getWriters = getReaderWriterMaker "_writers"
getReaders = getReaderWriterMaker "_readers"
getGroups =  (sessionId, db, cb) ->
  if sessionId
    whoami sessionId, db, (err, user) ->
      getCollection db, "user_groups", (err, userGroups) ->
        userGroups.findOne userId: user._id, (err, groups) ->
          cb err, [user._id, groups.groups...]
  else
    cb null, ['public']

  
  
save = (args, cb) ->
  {db, collection, obj, sessionId} = args
  if obj.name?.match /Javiera/i
    debug = true
    log obj
  debug = true
  isNew = true
  if "_id" of obj
    isNew = false
    obj._id = collections[db].ObjectID.createFromHexString(obj._id) 
  groups = null
  doTheSaving = () ->
    if isNew and sessionId
      if "_writers" not of obj
        obj._writers = [groups[0]] #default only you can edit
    if isNew and not sessionId
      if "_writers" not of obj
        obj._writers = ["public"] #anyone can edit
    if "_readers" not of obj
      obj._readers = ["public"] #default all can see
      
    if debug
      log "doing the saving"
      log obj
    getCollection db, collection, (err, _collection, extra) ->
      if err then return cb err
      _collection.save obj, (err, _obj) ->
        cb err, _obj 
      
  parallel [
    (cb) -> getWriters db, collection, obj._id, cb
    (cb) -> getGroups sessionId, db, cb
  ], (err, results) ->
    if debug
      log "the results are"
      log results
    [writers, groups] = results
    if doIgotWhatItTakes writers, groups
      doTheSaving() 
    else
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
        d null, user
  saveUserGroups = (user, d) ->
    getCollection db, "user_groups", (err, userGroups) ->
      userGroups.save
        userId: user._id
        groups: ["public"]
      , (err, group) ->
        d group
  series [saveUser, saveUserGroups], (err, [user, groups]) ->
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
        log "user created"
        log user
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

removeCollectionMaker = (db, collection) ->
  (cb) ->
    removeCollection db, collection, (err) ->
      cb()
  
removeCollection = (db, collection, cb) ->
  getCollection db, collection, (err, _coll) ->
    _coll.remove (err) ->
      cb err  

    

clearTests = (cb) ->
  db = "severus_drewl_us"
  parallel [
    removeCollectionMaker db, "users"
    removeCollectionMaker db, "user_groups"
    removeCollectionMaker db, "bands"
  ], (err) ->
    cb err, "test collecitons cleared"

  
rpcMethods = {
  login
  save
  find
  findOne
  remove
  test
  whoami
  clearTests

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

