var request = require('request');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
var conf = require('nconf');

conf.argv().env().file('./config/' + conf.get('NODE_ENV')  + '.json');

var userTableName = conf.get('USER_TABLE_NAME');

var api = {
  login: login,
  environment: environment,
  url: url
}

function getClient() {
  return oauth2Client = new OAuth2(
    conf.get('GOOGLE_CLIENT_ID'),
    conf.get('GOOGLE_CLIENT_SECRET'),
    conf.get('GOOGLE_REDIRECT_URL')
  );
}

function url(req, res) {

  var url = getClient().generateAuthUrl({
    access_type: 'online',
    scope: 'email'
  });

  res.send(url);
}

function login(bastard, req, res) {
  var oauth2Client = getClient();

  oauth2Client.getToken(req.query.code, function(err, tokens) {
    if(err) {
      res.send(err);
    }
    if(!err) {
      oauth2Client.setCredentials(tokens);
      plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
        var user = _getUser(bastard, response).then(function(user) {
          req.session.user = user;
          res.redirect('/app');
        });
      });
    }
  });
}

function _getUser(bastard, response, callback) {
  var email = response.emails[0].value;
  var user = {
    gender: response.gender,
    email: response.emails[0].value,
    displayName: response.displayName,
    name: response.name,
    avatar: response.image.url
  };

  return bastard.find(userTableName, {email: user.email}).then(function(results) {
    if(results.length) {
      return results[0];
    } else {
      return bastard.insertDocument(userTableName, user).then(function(result) {
        return result;
      });
    }
  });
}

function environment(req, res) {
  if(!req.session.user) {
    res.status(401).send('401 Unauthorized');
  }
  res.json(req.session.user);
}

module.exports = api;
