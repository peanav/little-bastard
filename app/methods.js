var utils = require('./utils');
var mongo = require('./mongo');

var api = {
  get: get,
  post: post,
  remove: remove
}

function get(req, res, next) {
  var parts = req.path.split('/').filter(utils.isTruthy);

  if(parts.length === 1) {
    // Get All Documents
    mongo.getCollection(parts[0], function(err, items) {
      if(err) {  return res.status(500).send(err.message); }
      res.json(items);
    });
  } else if(parts.length === 2) {
    // Get Document By Id
    mongo.getById(parts[0], parts[1], function(err, item) {
      if(err) {  return res.status(500).send(err.message); }
      res.json(item || {});
    });
  } else {
    // Get Documents By Search
  }
}

function post(req, res) {
  var parts = req.path.split('/').filter(utils.isTruthy);
  mongo.insertDocument(parts[0], req.body, function(err, result) {
    if(err) {  return res.status(500).send(err.message); }
    if(result.length === 1) {
      res.json(result[0]);
    } else {
      res.json(result);
    }
  });
}

function remove(req, res) {
  var parts = req.path.split('/').filter(utils.isTruthy);
  mongo.removeDocument(parts[0], parts[1], function(err, result) {
    if(err) {  return res.status(500).send(err.message); }
    res.send('Successfully removed document from collection ' + parts[0] + ' with id ' + parts[1]);
  });
}

module.exports = api;
