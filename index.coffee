redis = require "redis"
client = redis.createClient()
client.on "error", (err) ->
  console.log "Err #{err}"

# /create_user/username/password
# /login/username/password

handle_redis = (res) ->
  return (callback) ->
    callback = callback || () ->
    return (err, reply) ->
      if err
        console.log "Error #{err}"
        res.end JSON.stringify
          error: err
          result: ""
      else
        callback reply
error_out = (res, err) ->
  res.end JSON.stringify
    error: err
    result: ""
out = (res, obj) ->
  res.end JSON.stringify obj
sign_up = (username, password, req, res) ->
  r = handle_redis(res)
  client.sismember "users", username, r (reply) ->
    if reply is 1 then return error_out res, "Username already chosen"
    client.sadd "users", username, r (reply) ->
      if reply isnt 1 then return error_out res, "Unable to create user"
      client.incr "usercount", r (reply) ->
        user_id = reply
        client.hmset "users:#{user_id}", "password", password,"username", username, r (reply) ->  #no hashing the pw yet
          out reply 

root._ = require "underscore"
neckbrace = require "/root/workspace/neckbrace/index.coffee"
_p = neckbrace._p
_m = neckbrace._m
http = require "http"
server = http.createServer (req, res) ->
  res.writeHead 200, "content-type":"text/plain"

  if _.startsWith req.url, "/sign_up/"
    args = req.url.split "/"
    username = args[1]
    password = args[2]
    sign_up username, password, req, res
  else if _.startsWith req.url, "/login"
    args = req.url.split "/"
    username = args[1]
    password = args[2]
    login username, password, req, res
  else
    res.end _.s req.url, 0, "/sign_up/".length
    res.end "Unknown command. Fatal ERROR!!"

server.listen "9999"

#client.set "name", "drew", (err, reply) ->
#  client.get "name", (err, reply) ->
#    console.log reply + " is the reply"


