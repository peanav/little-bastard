var loginHandler = require('./app/login');
var postgresBastard = require('./app/postgres/postgresBastard');
var methods = require('./app/methods');

function db(app, connectionString) {
  var db = new postgresBastard(connectionString);
  methods.setupApp(app, db);
}

function login(app) {
  app.get('/loginurl', loginHandler.url);
  app.get('/loginCallback', loginHandler.login);
  app.get('/environment', loginHandler.environment);
}

module.exports = {
  db: db,
  login: login
}
