#!/usr/bin/env coffee
cgi = require "/root/sites/coffee-cgi/cgi"
sys = require "sys"
http = require "http"
stream = require "net"
Stream = stream.Stream
connect = require "connect"
express = require "express"
connect.Server.prototype.listen = (port, host) ->

express.Server.prototype.listen = () ->
  this.registerErrorHandlers()

sys.puts "Status: 200\r\n\r\nhello world"

handler = (req, res, next) ->
  sys.puts "yostart--"
  sys.puts JSON.stringify req
  sys.puts "--yoend"
  sys.puts next

app = express.createServer(handler)
app.use handler
app.use handler

app.listen()

sys.puts JSON.stringify app.stack

#app.emit('connection', new Stream())
#app.emit 'request', handler
#app.emit 'request', new http.ServerResponse()
app.emit 'request', new cgi.Request(), new cgi.Response() 
#app.handle({},{})
#for x in app.stack
  #x.handle()

