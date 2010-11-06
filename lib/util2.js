(function() {
  this.data = {
    insert: function(table, obj, ret) {
      var fields, query, real_vals, vals;
      fields = [];
      vals = [];
      real_vals = [];
      _.each(obj, function(val, key) {
        fields.push("`" + (key) + "`, ");
        vals.push("?, ");
        return real_vals.push(val);
      });
      fields = fields.join("");
      fields = _.s(fields, 0, -2);
      vals = vals.join("");
      vals = _.s(vals, 0, -2);
      query = ("INSERT INTO " + (table) + " (" + (fields) + ") VALUES (" + (vals) + ")");
      return client.query(query, real_vals, ret);
    },
    q: function(query, vals, ret) {
      return client.query(query, vals, ret);
    },
    update: function(table, obj, the_where, ret) {
      var query, real_vals, sets, wheres;
      sets = [];
      real_vals = [];
      _.each(obj, function(val, key) {
        sets.push("`" + (key) + "` = ?, ");
        return real_vals.push(val);
      });
      sets = sets.join("");
      sets = _.s(sets, 0, -2);
      wheres = [];
      _.each(the_where, function(val, key) {
        wheres.push("`" + (key) + "` = ? and ");
        return real_vals.push(val);
      });
      wheres = wheres.join("");
      wheres = _.s(wheres, 0, -(" and ".length));
      query = ("UPDATE " + (table) + " SET " + (sets) + " WHERE " + (wheres));
      return client.query(query, real_vals, ret);
    },
    insertMany: function(table, fields, vals, ret) {
      var db_fields, query, real_values, values;
      db_fields = [];
      _.each(fields, function(field) {
        return db_fields.push("`" + (field) + "`, ");
      });
      fields = db_fields.join("");
      fields = _.s(fields, 0, -2);
      values = [];
      real_values = [];
      _.each(vals, function(arr) {
        values.push("(");
        _.each(arr, function(each_val) {
          values.push("?, ");
          return real_values.push(each_val);
        });
        values[values.length - 1] = _.s(values[values.length - 1], 0, -2);
        return values.push("), ");
      });
      values = values.join("");
      values = _.s(values, 0, -2);
      query = ("INSERT INTO " + (table) + " (" + (fields) + ") VALUES " + (values));
      return client.query(query, real_values, ret);
    }
  };
  _.mixin({
    do_these: function(things, final_ret) {
      var done_ids, dones, make_done;
      dones = [];
      done_ids = {};
      make_done = function(id) {
        return function(ret) {
          var all_done;
          dones[id] = ret;
          done_ids[id] = true;
          all_done = true;
          _.each(things, function(func, id) {
            if (!(id in done_ids)) {
              all_done = false;
              return _.breakLoop();
            }
          });
          return all_done === true ? final_ret(dones) : null;
        };
      };
      return _.each(things, function(func, id) {
        return func(make_done(id));
      });
    }
  });
  this.parse_slon = function(str) {
    var _a, _b, _c, pair, ret;
    if (str.indexOf(":") === -1) {
      return str;
    } else {
      str = str.split(",");
      ret = {};
      _b = str;
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        pair = _b[_a];
        pair = pair.split(":");
        pair[0] = _.trim(pair[0]);
        pair[1] = _.trim(pair[1]);
        ret[pair[0]] = pair[1];
      }
      return ret;
    }
  };
})();
