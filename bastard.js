var login = require('./app/login');
var methods = require('./app/methods');

function init(app) {
  app.get('/loginurl', login.url);
  app.get('/loginCallback', login.login);
  app.get('/environment', login.environment);

  app.get('*', methods.get);
  app.post('*', methods.post);
  app.delete('*', methods.remove);
}

module.exports = {
  init: init
}
