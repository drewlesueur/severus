#todo make insert handle more than one object at a time
insert = (args, req, res) ->
  db.collection args._type or "things", (err, collection) ->
      if err
        console.log err
        res.send "error with insert"
      else
        args._user = req.user()
        delete args._id
        collection.insert args, (err, docs) ->
          if err
            console.log err
            res.send "super error"
          res.send doc._id for doc in docs
  
update = (args, req, res) ->
  db.collection args._type or "things", (err, collection) ->
    if err
      console.log err
      res.send "broke"
    else
      args.wh._user = req.user()
      if "_id" of args.va
        delete args.va._id
      if "_id" of args.wh
        args.wh._id = ObjectID.createFromHexString(args.wh._id)

      collection.update args.wh, args.va, {upsert: args.upsert or false, multi: args.multi or false}, (err, wha) ->
         #res.send doc._id for doc in wha
         res.send args.wh._id
         
this.methods =
  #shorthand for insert
  ins: (args, req, res) ->
    
    
  test2: (args, req, res) ->
    res.send "a ute latanbora"
    
  insert : insert
  find : (args, req, res) ->
    db.collection args._type or "things", (err, collection) ->
      if err
        console.log err
        res.send "error with find"
      else
        try
          if "_id" of args
            args._id = ObjectID.createFromHexString(args.wh._id)
          args["$where"] = "(this._user == '#{req.user()}' || this._public == true)"
          collection.find args, (err, cursor) ->
            cursor.toArray (err, docs) ->
              res.send docs
        catch e
          res.send e
  update : update
          
  remove: (args, req, res) ->
     db.collection args._type or "things", (err, collection) ->
      if err
        res.send "broke"
      else
        args._user = req.user()
        if "_id" of args
          args._id = ObjectID.createFromHexString(args._id)
        collection.remove args, (err, collection) ->
          res.send "done"
  
  test: () ->
    console.log "test"
  
  #use upsert instead of this! maybe not  
  addedit: (args, req, res) ->
    console.log "got to add edit"
    db.collection args._type or "things", (err, collection) ->
      if err
        res.send "addedit error"
      else
        try
          if "_id" of args #update
            orig_args = args
            args = {}
            args.wh = {}
            args.wh._id = orig_args._id
            delete orig_args._id
            args.va = orig_args
            args._type = orig_args._type
            update args, req, res
          else   #create    
            insert args, req, res
        catch e
          res.send e
            
  