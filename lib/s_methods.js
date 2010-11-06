(function() {
  this.s_methods = {
    insert: function(args, req, res) {
      return methods.insert(args.q, req, res);
    },
    find: function(args, req, res) {
      return methods.find(args.q, req, res);
    }
  };
})();
