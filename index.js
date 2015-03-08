var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var session = require('express-session');
var uuid = require('node-uuid');
var conf = require('nconf');
var methods = require('./app/methods');
var login = require('./app/login');

conf.argv().env().file('./config/' + conf.get('NODE_ENV')  + '.json');

var app = express();
app.use(express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  genid: function(req) { return uuid.v4(); },
  resave: false,
  saveUninitialized: false,
  secret: conf.get('SESSION_SECRET')
}));

app.get('/loginurl', login.url);
app.get('/loginCallback', login.login);
app.get('/environment', login.environment);

app.get('*', methods.get);
app.post('*', methods.post);
app.delete('*', methods.remove);

var port = conf.get('PORT') || 3000;
var server = app.listen(port, function() {
  console.log("Lil' Bastard is running on port " + port);
});
