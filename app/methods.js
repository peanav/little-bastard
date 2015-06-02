var utils = require('./utils');
var database;

var api = {
  setupApp: setupApp
}

function setupApp(app, db) {
  database = db;
  app.get('*', get);
  app.post('*', post);
  app.delete('*', remove);
}

function getPathParts(req) {
  return req.path.split('/').filter(utils.isTruthy);
}

function get(req, res, next) {
  var method, parts = getPathParts(req);

  if(parts.length === 1) {
    method = findAll;
  } else if(parts.length === 2) {
    method = findOne;
  } else {
    method = find;
  }

  method(res, parts);
}

function findAll(res, parts) {
  database.findAll(parts[0]).then(function(items) {
    res.json(items);
  }, function(err) {
    return res.status(500).send(err.message);
  });
}

function findOne(res, parts) {
  database.getById(parts[0], parts[1], function(err, item) {
    if(err) {  return res.status(500).send(err.message); }
    if(item.length === 1) {
      res.json(item[0]);
    } else {
      res.json(item);
    }
  });
}

function find(res, parts) {
  var filter = parts.reduce(function(memo, part, index) {
    if(index && index%2) {
      var argument = decodeURI(parts[index+1]);
      memo[part] = isNaN(+argument) ? argument : +argument;
    }
    return memo;
  }, {});
  database.getWithFilter(parts[0], filter, function(err, items) {
    res.json(items);
  });
}


function post(req, res) {
  var parts = getPathParts(req);
  //console.log(parts);

  if(parts.length === 1) {
    database.insertDocument(parts[0], req.body).then(function(result) {
      if(result.length === 1) {
        res.json(result[0]);
      } else {
        res.json(result);
      }
    }, function(err) {
      return res.status(500).send(err.message);
    });
  } //else if(parts.length === 2) {
    //pg.updateDocument(parts[0], parts[1], req.body, function(err, result) {
      //if(err) {  return res.status(500).send(err.message); }
      //if(result > 0) {
        //get(req, res);
      //} else {
        //req.status(304).send('Nothing was updated');
      //}
    //});
  //}
}

function remove(req, res) {
  //var parts = getPathParts(req);
  //pg.removeDocument(parts[0], parts[1], function(err, result) {
    //if(err) {  return res.status(500).send(err.message); }
    //res.json(result);
  //});
}

module.exports = api;
