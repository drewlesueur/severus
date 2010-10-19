
this.s_methods =
  insert: (args, req, res) ->
    methods.insert args.q, req, res
  find: (args, req, res) ->
    methods.find args.q, req, res