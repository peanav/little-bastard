var utils = require('./utils');
var pg = require('./pg');

var api = {
  get: get,
  post: post,
  remove: remove
}

function getPathParts(req) {
  return req.path.split('/').filter(utils.isTruthy);
}

function get(req, res, next) {
  var parts = getPathParts(req);

  if(parts.length === 1) {
    // Get All Documents
    pg.getAll(parts[0], function(err, items) {
      if(err) {  return res.status(500).send(err.message); }
      res.json(items);
    });
  } else if(parts.length === 2) {
    // Get Document By Id
    pg.getById(parts[0], parts[1], function(err, item) {
      if(err) {  return res.status(500).send(err.message); }
      if(item.length === 1) {
        res.json(item[0]);
      } else {
        res.json(item);
      }
    });
  } else {
    var filter = parts.reduce(function(memo, part, index) {
      if(index && index%2) {
        var argument = decodeURI(parts[index+1]);
        memo[part] = isNaN(+argument) ? argument : +argument;
      }
      return memo;
    }, {});
    pg.getWithFilter(parts[0], filter, function(err, items) {
      res.json(items);
    });
  }
}

function post(req, res) {
  var parts = getPathParts(req);
  console.log(parts);

  if(parts.length === 1) {
    pg.insertDocument(parts[0], req.body, function(err, result) {
      if(err) {  return res.status(500).send(err.message); }
      if(result.length === 1) {
        res.json(result[0]);
      } else {
        res.json(result);
      }
    });
  } else if(parts.length === 2) {
    pg.updateDocument(parts[0], parts[1], req.body, function(err, result) {
      if(err) {  return res.status(500).send(err.message); }
      if(result > 0) {
        get(req, res);
      } else {
        req.status(304).send('Nothing was updated');
      }
    });
  }
}

function remove(req, res) {
  var parts = getPathParts(req);
  pg.removeDocument(parts[0], parts[1], function(err, result) {
    if(err) {  return res.status(500).send(err.message); }
    res.json(result);
  });
}

module.exports = api;
