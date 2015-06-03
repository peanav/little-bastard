var utils = require('./utils');
var database;

var api = {
  process: process
}

var methods = {
  get: get,
  post: post,
  delete: remove
}


function process(database, req, res) {
  methods[req.method.toLowerCase()](database, req, res);
}

function getPathParts(req) {
  return req.path.split('/').filter(utils.isTruthy);
}

function get(database, req, res, next) {
  var method, sort, parts = getPathParts(req);

  if(parts.length === 1) {
    method = findAll;
  } else if(parts.length === 2) {
    method = findOne;
  } else {
    method = find;
  }

  if(req.query._sort) {
    sort =  {
      key: req.query._sort,
      order: req.query._order || 'asc',
      type: req.query._sort_type
    }
  }

  method(database, res, parts, sort);
}

function findAll(database, res, parts, sort) {
  database.findAll(parts[0], sort).then(function(items) {
    res.json(items);
  }, function(err) {
    return res.status(500).send(err.message || err);
  });
}

function findOne(database, res, parts) {
  database.findOne(parts[0], parts[1]).then(function(item) {
    if(item.length === 1) {
      res.json(item[0]);
    } else {
      res.json(item);
    }
  }, function(err) {
    return res.status(500).send(err.message || err);
  });
}

function find(database, res, parts, sort) {
  var filter = parts.reduce(function(memo, part, index) {
    if(index && index%2) {
      var argument = decodeURI(parts[index+1]);
      memo[part] = isNaN(+argument) ? argument : +argument;
    }
    return memo;
  }, {});

  return database.find(parts[0], filter, sort).then(function(items) {
    res.json(items);
  }, function(err) {
    return res.status(500).send(err.message || err);
  });
}


function post(database, req, res) {
  var parts = getPathParts(req);

  if(parts.length === 1) {
    database.insertDocument(parts[0], req.body).then(function(result) {
      if(result.length === 1) {
        res.json(result[0]);
      } else {
        res.json(result);
      }
    }, function(err) {
      return res.status(500).send(err.message || err);
    });
  } else if(parts.length === 2) {
    //Remove the autogenerated stuff;
    var autogenFields = ['id', 'user_id', '_created_date', '_last_updated_date'];
    autogenFields.forEach(function(field) { delete req.body[field]; });

    database.updateDocument(parts[0], parts[1], req.body).then(function(result) {
      if(result > 0) {
        get(req, res);
      } else {
        req.status(304).send('Nothing was updated');
      }
    }, function(err) {
      return res.status(500).send(err.message || err);
    });
  }
}

function remove(database, req, res) {
  var parts = getPathParts(req);
  database.removeDocument(parts[0], parts[1]).then(function(result) {
    res.json(result);
  }, function(err) {
     return res.status(500).send(err.message || err);
  });

}

module.exports = api;
