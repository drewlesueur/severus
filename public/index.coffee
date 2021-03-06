$ = require "jquery"
severus = require "severus"
_ = require "underscore"
nimble = require "nimble"
drews = require "drews-mixins"

{log} = _
{assertEqual: eq} = drews
{series} = nimble
$ ->
 
  {save, find, remove, login, serv, server} = severus
  
  band =
    name: "Aterciopelados"
    cd: ["Caribe Atomico", "Rio"]

  id = null
  tests = [ (d)->d()
  (d) -> server "clearTests", (err) ->
    log "testes cleared"
    d err
  (d) -> remove "bands", (err, result) ->
    find "bands", (err, results) ->
      log "the removed results are"
      log results
      eq results.length, 0, "removing should give us no results"
      save "bands", band, (err, result) ->
        eq result.name, "Aterciopelados"
        band = result
        find "bands", (err, results) ->
          eq results.length, 1, "Should get 1 result"
          result = results[0]
          eq result.name, "Aterciopelados", "Name should be atercios"
          d()

  (d) -> save "bands",
    name: "Julieta Venegas"
    age: 40
    songs: ["me voy", "otra cosa"]
  , (err, result) ->
    find "bands", age: 40, (err, results) ->
      eq results[0].age, 40, "should get age" 
      d()


  (d) -> remove "bands", (err) ->
    band = name: "choc quib town", albums: ["oro"]
    save "bands", band, (err, band) ->
      band.members = ["goyo", "tostao", "slow"]
      save "bands", band, (err) ->
        find "bands", (err, bands) ->
          eq bands.length, 1, "saving should overwrite"
          d()


  (d) -> login "drew", "passw0rd", (err, user) ->
    log user
    sessionId = user.sessionId
    eq user.username, "drew", "username should match"
    series [
      (cb) -> serv "whoami", (err, user) ->
        eq err, null
        log err
        eq user.username, "drew", "whoami should work"
        cb null, user._id
      (id, cb) ->
        band = name: "Javiera Mena"
        save "bands", band, (err, band) ->
          eq band.name, "Javiera Mena", "name should equal"
          eq band._writers, id, "only I can write"
          login "hector", "passw0rd", (err, user) ->
            band.origin = "chile"
            save "bands", band, (err, _band) ->
              eq not _.isNull(err), true, "error should be something"
              remove "bands", band._id, (err) ->
                eq not _.isNull(err), true, "should be error for remove"
                find "bands", band._id, (err, _band) ->
                  eq _band._id, band.id, "removing doesn't error but you can't remove w/o permissions"
                  cb()
    ], (err, results) ->
      d err

  ] # end tests

    
  series tests, -> log """
    #{drews.getPassCount()}/#{drews.getAssertCount()} assertions passed
    #{drews.getFailedMessages()}
  """

  


    
    
    
 

 


  
###
  server "save", "severus_drewl_us", "test"
    name: "Drew"
    song: "ecos de canto llegan al sol"
  , (err, data) ->
    log data

  server "find", "severus_drewl_us", "test", (err, data) ->
    log data
  server "remove", "severus_drewl_us", "test", (err, data) ->
    log data

###
