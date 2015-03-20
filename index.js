var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('node-uuid');
var conf = require('nconf');
var bastard = require('./bastard');

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

bastard.init(app);

var port = conf.get('PORT') || 3000;
var server = app.listen(port, function() {
  console.log("Lil' Bastard is running on port " + port);
});
