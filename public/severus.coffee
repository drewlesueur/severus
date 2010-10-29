Severus = {}
this.Severus = Severus
_ = this._
$ = this.$

uniqueid = 0;

Severus.successes = {}
Severus.errors = {}
Severus.callbacks = {}

Severus.initialize = (url, callback) ->
  this.url = url or "/iframe.html"
  sev = this
  iframe = $ """<iframe src="#{this.url}" ></iframe>"""
  iframe.bind "load", () ->
    Severus.set {url: sev.url}, (data) ->
      callback()
      
  $(document.body).append iframe
  this.iframe = iframe[0]
  self = this
  window.addEventListener "message", ((e) ->
    message = JSON.parse e.data
    id = message.id
    data = message.data
    type = message.type
    if type is "success" and self.successes? and id of self.successes
      self.successes[id] data
    else if type is "error" and self.errors? and id of self.errors
      self.errors[id] data
    else if type is "callback"
      self.callbacks[id] data
    else if type is "redirect"
      location.href = data.url
    if self.successes? and id of self.successes
      delete self.successes[id]
    if self.errors? and id of self.errors
      delete self.errors[id]
    if self.callbacks? and id of self.callbacks
      delete self.errors[id]
  ), false
  

Severus.facebook =
  client_id: "162705547084211"
  
# for now, just using facebook authentication    

Severus.server = (method, args, func) ->
  Severus.ajax
    type: "POST",
    url : "/#{method}"
    data: {"q": JSON.stringify(args)}
    success: (data) ->
      func and func data

Severus.ajax = (args) ->
  id = uniqueid++
  wrapped = id : id, args: args, type: "ajax"
  this.successes[id] = args.success
  this.errors[id] = args.errors
  if args.success?
    args.success = id
  if args.error?
    args.error = id
  this.iframe.contentWindow.postMessage JSON.stringify(wrapped), "*" # change that star later

Severus.login = (loc, callback) ->
  loc = loc || location.href
  Severus.post "login", {loc: "1", callback: callback}

Severus.set = (sets, callback) ->
  args = {}
  args.sets = sets
  args.callback = callback
  Severus.post "set", args
  

Severus.post = (type, args) ->
  id = uniqueid++
  wrapped = id : id, args: args, type: type
  this.callbacks[id] = args.callback
  if args.callback?
    args.callback = id
  this.iframe.contentWindow.postMessage JSON.stringify(wrapped), "*" # change that star later
 
# for the severus client iframe to accept messages frok the oarent page 
Severus.acceptMessages = (whitelist) ->
  whitelist = whitelist || []
  sev = this
  window.addEventListener "message", ((e) ->
    if whitelist.length is 0 or _.indexOf(whitelist, e.origin) isnt -1
      message = JSON.parse e.data
      args = message.args
      id = message.id
      if message.type is "ajax" #do an ajax request
        posted = 
          id: id
          type: "success"
          dataType: args.dataType
        if args.success?
          args.success = (data) ->
            posted.data = data
            parent.postMessage JSON.stringify(posted), "*"
        if args.error?
          args.error = (data) ->
            posted.type = "error"
            posted.data = data
            parent.postMessage JSON.stringify(poted), "*"
        $.ajax args
      else if message.type is "login" #authenticate with facebook.
        url = "https://graph.facebook.com/oauth/authorize"
        url += "?client_id=#{Severus.facebook.client_id}"
        url += "&type=user_agent"
        redirect_uri =  encodeURIComponent(sev.url + "?redirect_url=" + encodeURIComponent(args.loc)) #double time
        url += "&redirect_uri=#{redirect_uri}"
        # window.open url, null, "width=400,height=200"
        # window.open url
        # location.href = url
        post = 
          type: "redirect"
          data:
            url: url
        parent.postMessage JSON.stringify(post), "*"
      else if message.type is "set"
        _.extend sev, message.args.sets
        posted = 
          id: id
          type: "callback"
          data: "yay"
        parent.postMessage JSON.stringify(posted), "*"
        
  ), false