var loginHandler = require('./app/login');
var postgresBastard = require('./app/postgres/postgresBastard');
var methods = require('./app/methods');
var database;

function db(connectionString) {
  database = new postgresBastard(connectionString);
  return _apiMiddleware;
}

function _apiMiddleware(req, res, next) {
  methods.process(database, req, res);
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
