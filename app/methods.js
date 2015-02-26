var utils = require('./utils');
var mongo = require('./mongo');

var api = {
  get: get,
  post: post
}

function get(req, res) {
  var parts = req.path.split('/').filter(utils.isTruthy);

  if(parts.length === 1) {
    // Get All Documents
    mongo.getCollection(parts[0], function(items) {
      res.json(items);
    });
  } else if(parts.length === 2) {
    // Get Document By Id
    mongo.getById(parts[0], parts[1], function(item) {
      res.json(item);
    });
  } else {
    // Get Documents By Search
  }
}

function post(req, res) {
  var parts = req.path.split('/').filter(utils.isTruthy);
  mongo.insertDocument(parts[0], req.body, function(err, result) {
    if(err) {
      res.send();
    } else {
      if(result.length === 1) {
        res.json(result[0]);
      } else {
        res.json(result);
      }
    }
  });
}

module.exports = api;
