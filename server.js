(function() {
  var app;
  require.paths.unshift("vendor/connect/lib");
  require.paths.unshift("vendor/connect-auth/lib");
  require.paths.unshift("vendor/express/lib");
  require.paths.unshift("vendor/haml.js/lib");
  require.paths.unshift("vendor/node-oauth/lib");
  require.paths.unshift("vendor/node-mongodb-native/lib");
  require.paths.unshift("vendor/node-mysql/lib");
  require.paths.unshift("vendor/jade/lib");
  require.paths.unshift("vendor/connect-form/lib");
  require.paths.unshift("vendor/node-formidable/lib");
  require.paths.unshift("vendor/request/lib");
  app = require("./lib/app.coffee");
  app.run();
})();
