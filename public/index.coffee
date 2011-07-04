$ = require "jquery"
severus = require "severus"
_ = require "underscore"
nimble = require "nimble"
drews = require "drews-mixins"

{log} = _
{assertEqual: eq} = drews
{series} = nimble
$ ->
 
  {save, find, remove} = severus
  
  band =
    name: "Aterciopelados"
    cd: ["Caribe Atomico", "Rio"]

  id = null
  tests = [ (d)->d()
  (d) -> remove "bands", (err, result) ->
    find "bands", (err, results) ->
      eq results.length, 0, "removing should give us no results"
      save "bands", band, (err, result) ->
        eq result.length, 1, "length should be 1"
        eq result[0].name, "Aterciopelados"
        band = result[0]
        find "bands", (err, results) ->
          eq results[0].name, "Aterciopelados"
          band.concerts = ["Colombia", "California"]
          d()

  (d) -> save "bands",
    name: "Julieta Venegas"
    age: 40
    songs: ["me voy", "otra cosa"]
  , (err, reslut) ->
    find "bands", age: 40, (err, results) ->
      eq results[0].age, 40, "should get age" 
      d()
  ]

    
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
