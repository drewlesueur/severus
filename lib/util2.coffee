this.data = 
  insert: (table, obj, ret) ->
    fields = []
    vals = []
    real_vals = []
    _.each obj, (val, key) ->
      fields.push "`#{key}`, "
      vals.push "?, "
      real_vals.push val
    fields = fields.join "" #join fields
    fields = _.s fields, 0, -2 #remove trailing comma
    vals = vals.join ""
    vals = _.s vals, 0, -2 # remove trailing comma
    query = "INSERT INTO #{table} (#{fields}) VALUES (#{vals})"
    client.query query, real_vals, ret
   
  q: (query, vals, ret) ->
      client.query query, vals, ret
      
  update: (table, obj, the_where, ret) ->
    sets = []
    real_vals = []
    _.each obj, (val, key) ->
      sets.push "`#{key}` = ?, "
      real_vals.push val
    sets = sets.join ""
    sets = _.s sets, 0, -2
    
    wheres = []
    _.each the_where, (val, key) ->
      wheres.push "`#{key}` = ? and "
      real_vals.push val
    wheres = wheres.join ""
    wheres = _.s wheres, 0, -(" and ".length) #removeing last 'and'
    query = "UPDATE #{table} SET #{sets} WHERE #{wheres}"
    client.query query, real_vals, ret

  insertMany: (table, fields, vals, ret) ->
    db_fields = []
    _.each fields, (field) ->
      db_fields.push "`#{field}`, "
    fields = db_fields.join "" #join fields
    fields = _.s fields, 0, -2 #remove trailing comma
    
    values = []
    real_values = []
    _.each vals, (arr) ->
      values.push "("
      _.each arr, (each_val) ->
        values.push "?, "
        real_values.push each_val
      values[values.length - 1] = _.s values[values.length - 1], 0, -2
      values.push "), "
    values = values.join ""
    values = _.s values, 0, -2
    
    query = "INSERT INTO #{table} (#{fields}) VALUES #{values}"
    client.query query, real_values, ret
    

_.mixin
  do_these: (things, final_ret) ->
    # an easy abstraction for doing more that one thing at once and then returning when they are all done
    dones = []
    done_ids = {}
    make_done = (id) ->
      return (ret) ->
        dones[id] = ret
        done_ids[id] = true
        all_done = true
        _.each things, (func, id) ->
          if not(id of done_ids)
            all_done = false
            _.breakLoop()
        if all_done is true
          final_ret(dones)
    _.each things, (func, id) ->
      func(make_done(id))
      
    
    