var loginHandler = require('./app/login');
var methods = require('./app/methods');

function db(bastard, session) {
  return function(req, res, next) {
    methods.process(bastard, req, res, next, 20);
  }
}

function login(bastard) {
  return function(req, res, next) {
    if(req.path === '/loginurl') {
      loginHandler.url(req, res);
    } else if(req.path === '/loginCallback') {
      loginHandler.login(bastard, req, res);
    } else if(req.path === '/environment') {
      loginHandler.environment(req, res);
    } else {
      next();
    }
  }
}

module.exports = {
  db: db,
  login: login
}
