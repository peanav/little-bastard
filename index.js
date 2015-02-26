var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var conf = require('nconf');
var methods = require('./app/methods');

conf.argv().env().file('./config/' + conf.get('NODE_ENV')  + '.json');

var app = express();
app.use(express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.get('*', methods.get);
app.post('*', methods.post);

var port = conf.get('PORT') || 3000;
var server = app.listen(port, function() {
    console.log('Your PeaNav Server is up and running on port ' + port + ', you little bastard');
});
