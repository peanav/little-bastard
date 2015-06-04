var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('node-uuid');
var conf = require('nconf');
var bastard = require('./bastard');
//var PostgresBastard = require('./app/postgres/postgresBastard');
var RethinkBastard = require('./app/rethinkdb/RethinkBastard');

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


//var postgres = new PostgresBastard('postgres://localhost/test');
var rethink = new RethinkBastard();
app.use('/api/v1', bastard.db(rethink));
//app.use(bastard.login(postgres));


var port = conf.get('PORT') || 3000;
var server = app.listen(port, function() {
  console.log("Lil' Bastard is running on port " + port);
});
