Severus = {}
this.Severus = Severus
_ = this._
$ = this.$

uniqueid = 0;

Severus.successes = {}
Severus.errors = {}

Severus.initialize = (url, callback) ->
  this.url = url or "/iframe.html"
  iframe = $ """<iframe src="#{this.url}" ></iframe>"""
  iframe.bind "load", () ->
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
    if self.successes? and id of self.successes
      delete self.successes[id]
    if self.errors? and id of self.errors
      delete self.errors[id]
  ), false

Severus.ajax = (args) ->
  id = uniqueid++
  wrapped = id : id, args: args
  this.successes[id] = args.success
  this.errors[id] = args.errors
  if args.success?
    args.success = id
  if args.error?
    args.error = id
  this.iframe.contentWindow.postMessage JSON.stringify(wrapped), "*" # change that star later
  
Severus.acceptMessages = (whitelist) ->
  whitelist = whitelist || []
  window.addEventListener "message", ((e) ->
    if whitelist.length is 0 or _.indexOf(whitelist, e.origin) isnt -1
      message = JSON.parse e.data
      args = message.args
      id = message.id
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
  ), false