#!/usr/bin/env coffee
cgi = require "/root/sites/coffee-cgi/cgi"
sys = require "sys"
http = require "http"

http.IncomingMessage = cgi.Request
http.ServerResponse = cgi.Response


connect = require "connect"
express = require "express"
connect.Server.prototype.listen = (port, host) ->
express.Server.prototype.listen = () ->
  this.registerErrorHandlers()



app = express.createServer()

app.use (req, res, next) ->
  req.expresscgi = "just an an example of using `use` !" 
  next()


app.use (req,res,next) ->
  #don't call `next()` and it will never get to the defualt handling
  res.send ['haha', 'dog']


app.get "/index.cs",  (req, res) ->
  res.send req.expresscgi

#app.emit 'request', new cgi.Request(), new cgi.Response() 
app.emit 'request', new http.IncomingMessage(), new http.ServerResponse() 


# other tries below
#app.emit('connection', new Stream())
#app.emit 'request', handler
#app.emit 'request', new http.ServerResponse()
#app.handle({},{})
#for x in app.stack
  #x.handle()

