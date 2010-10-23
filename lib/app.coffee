require "./secret.coffee"

request = require "request"
this.request = request

mongo = require("mongodb")
host = 'localhost'
port = mongo.Connection.DEFAULT_PORT

Auth = require "auth"
fs = require "fs"
require ("./underscore")
require("./util")
require("./util2.coffee")
require("./methods")
require("./s_methods")

form = require "connect-form"
express = require("express")
app = express.createServer()


MyTest = (req, res, next) ->
  req.party = "have a party"
  res.party = "have a double time party"
  if not req.session.officelist
    req.session.officelist = {}

  req.user = () ->
    return req.session.officelist.userdomain + ":" + req.session.officelist.userid
  
  next()


app.configure () ->
  app.set("root", __dirname)
  app.set('views', __dirname + '/views')
  # app.use(express.logger())
  app.use(express.staticProvider("public"))
  # console.log(__dirname)
  app.use(express.methodOverride())
  app.use(express.bodyDecoder())
  app.use(express.cookieDecoder())
  app.use(express.session({ lifetime: (150).seconds, reapInterval: (10).seconds }))
  app.use(Auth([ Auth.Anonymous(), Auth.Never(), Auth.Twitter(twitter_config) ]))
  app.use MyTest
  app.use form(keepExtensions: true)


this.ObjectID = mongo.ObjectID
this.db = new mongo.Db 'mydb', new mongo.Server(host, port, {}), {}


app.get "/test", (req , res) ->
  res.send "toquemen el bombo"

handle_methods = (req, res, args) ->
  console.log args
  method = req.param("method") 
  args = decodeURIComponent(args.q);
  console.log args
  methods[method] JSON.parse(args), req, res #, db


handle_s_methods = (req, res, args) ->
  method = req.param("method")
  new_args = {}
  for key, val of args
    new_args[key] = parse_slon val 
  s_methods[method] new_args, req, res 
  
this.db.open () -> 
  app.post "/:method", (req, res) ->
    if req.param("method") of methods
      handle_methods req, res, req.body

  app.get "/:method", (req, res) ->
    if req.param("method") of methods
      handle_methods req, res, req.query
  
  app.get "/s.:method", (req, res) ->
    if req.param("method") of s_methods
      handle_s_methods req, res, req.query
    else
      console.log "not there"
  
# take and image upload it and return the address for the thumbnail
app.post "/upload-image", (req, res) ->
  req.form.complete (err, fields, files) ->
    if err
      res.send("error")
    if files
      file_name = files.myfile.path.split "/"
      file_name = _.s(file_name, -1)[0]
      output_file = "public/images/thumbs/#{file_name}"
      exec "convert #{files.myfile.path} -resize 50x50 #{output_file}", (err, stdin, stdout) ->
        medium_output_file = "public/images/medium/#{file_name}"
        exec "convert #{files.myfile.path} -resize 450x450 #{medium_output_file}", (err, stdin, stdout) ->
          res.send _.s(file_name) #get rid of public from the string
        
        
      #res.send(JSON.stringify files)
 
app.get "/json", (req, res) ->
  res.send
    test: "json"
    really: "cool"

app.get "/", (req, res) ->
  if req.isAuthenticated()
    username = req.getAuthDetails().user.username
  else
    username = "none"
  res.send req.user()
  

app.get '/auth/:auth_strategy', (req, res, params) ->
  
  #if false and _(req.headers.host).startsWith "localhost"
  #  authentication_strategy = "anon"
  #else
  authentication_strategy = req.params.auth_strategy
  console.log authentication_strategy
  req.authenticate [authentication_strategy], (error, authenticated) ->
    res.writeHead(200, {'Content-Type': 'text/html'})
    if authenticated
      req.session.officelist.userdomain = authentication_strategy
      if authentication_strategy is "twitter"
        req.session.officelist.userid = req.getAuthDetails().user.user_id
      else if authentication_strategy is "anon"
        req.session.officelist.userid = req.getAuthDetails().user.username
      # console.log "user login " +  JSON.stringify req.getAuthDetails()
      # console.log req.session.access_token
      res.redirect "/"
    else
      res.redirect "/"

app.get '/coffee/:name.js', (req, res) ->
  exec "coffee -c public/js/" + req.params.name + '.coffee', (error, stdout, stderr) ->
    if error
      1 == 1
    fs.chmod 'public/js/' + req.params.name + '.js', parseInt("777", 8), () ->
      res.sendfile('public/js/' + req.params.name + '.js')

app.get "/logout", (req, res, params) ->
  req.logout()
  res.redirect "/"

exports.run = () ->
  app.listen parseInt(process.env.PORT or 86), null
