var pg = require('pg');
var Promise = require('bluebird');

var conString = "postgres://localhost/test";
var currentTableNames;
var scope = {};
scope.user = {};
var argumentTester = /[;']/ig;

var api = {
  run: run,
  getAll: getAll,
  getById: getById,
  getWithFilter: getWithFilter,
  insert: insert,
  update: update,
  remove: remove,
  createTable: createTable,
  addUserScopeToTable: addUserScopeToTable,
  _tableExists: _tableExists
}

//_getCurrentTableNames().then(function() {
  //console.log(currentTableNames, scope);
//});

function _isUserScoped(tableName) {
  return _getTableSchema(tableName).then(function(schema) {
    return schema.filter(function(columnName) {
      return columnName === '_user_id';
    }).length > 0;
  });
}

function _getCurrentTableNames() {
  if(currentTableNames) {
    return new Promise(function(resolve) {
      resolve(currentTableNames);
    });
  }
  var tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';";
  return run(tableQuery).then(function(result) {
    var names = result.rows.map(function (row) { return row.table_name; });
    currentTableNames = names;

    var promises = names.reduce(function(memo, tableName) {
      memo[tableName] = _isUserScoped(tableName);
      return memo;
    }, {});

    return Promise.props(promises).then(function(results) {
      scope.user = results;
      return names;
    });
  });
}

function _getTableSchema(tableName) {
  var tableSchemaQuery = "select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name = '" + tableName + "';";
  return run(tableSchemaQuery).then(function(res) {
    return res.rows.map(function(column) { return column.column_name; });
  });
}

function run(query) {
  return new Promise(function(resolve, reject) {
    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query(query, function(err, result) {
        if(err) {
          reject('error running query', err);
        }
        client.end();
        resolve(result);
      });
    });
  });
}

function getAll(tableName, callback) {
  if(!_validArguments(tableName)) {
    return callback(new Error('You are trying to do something dangerous, you lil\' bastard'));
  }
  _tableExists(tableName).then(function(exists) {
    if(exists) {
      return callback(new Error('Resource "' + tableName + '" does not exist'));
    }
    run('select * from ' + tableName, function(err, result) {
      callback(null, result.rows.map(_rowToObject));
    });
  });
}

function getById(tableName, id, callback) {
  if(!_validArguments(tableName, id)) {
    return callback(new Error('You are trying to do something dangerous, you lil\' bastard'));
  }
  run("select * from " + tableName + " where id='" + id + "'", function(err, result) {
    if(!result || !result.rows) { return callback(new Error("Row with id: " + id + " not found")); }
    callback(null, result.rows.map(_rowToObject));
  });
}

function getWithFilter(tableName, filter, callback) {
  run("select * from " + tableName + " where _data @> '" + JSON.stringify(filter) + "'", function(err, result) {
    callback(null, result.rows.map(_rowToObject));
  });
}

function insert(tableName, data, callback) {
  createTable(tableName, function(result) {
    var query = 'insert into ' + tableName + ' (_created_date, _last_updated_date, _data) values (' +
      'now(), now(), \'' + JSON.stringify(data) + '\') returning id, _created_date, _last_updated_date, _data;';
    run(query, function (err, result) {
      callback(err, _rowToObject(result.rows[0]));
    });
  });
}

function update(tableName, id, data, callback) {
  var query = "update " + tableName + " set _last_updated_date=now(), _data='" +
    JSON.stringify(data) + "' where id='" + id + "';";
  run(query, function (err, result) {
    callback(err, result.rowCount);
  });
}

function remove(tableName, id, callback) {
  var query = "delete from " + tableName + " where id='" + id + "';";
  run(query, function(err, result) {
    if(result.rowCount === 1) {
      callback(null, { message: "Successfully removed row \"" + id + "\" from table " + tableName });
    } else {
      callback(new Error("Did not remove a row"));
    }
  });
}


function createTable(tableName, callback) {
  return _tableExists(tableName).then(function(exists) {
    if(exists) {
      return false;
    } else {
      var query = '' +
        'create table ' + tableName + '(' +
        'id uuid primary key default uuid_generate_v4(),' +
        '_created_date timestamp not null,' +
        '_last_updated_date timestamp not null,' +
        '_data jsonb not null);';

      return run(query).then(function(result) {
        if(!currentTableNames) {
          currentTableNames = [];
        }
        currentTableNames.push(tableName);
        return result;
      });
    }
  });
}

function addUserScopeToTable(tableName, callback) {
  var query = '' +
    'alter table ' + tableName + ' ' +
    'add column _user_id varchar(50) not null;';

  run(query, function(err, result) {
    if(err) { console.log(err); return callback(err); }
    callback(result);
  });
}

function _validArguments() {
  return Array.prototype.slice.call(arguments, 0).reduce(function(memo, arg) {
    if(!memo) { return memo; }
    return !argumentTester.test(arg);
  }, true);
}

function _correctTableName(tableName) {
  return !re.test(tableName);
}

function _tableExists(tableName) {
  return _getCurrentTableNames().then(function(tableNames) {
    return tableNames.reduce(function(memo, name) {
      if(!memo) {
        memo = name === tableName;
      }
      return memo;
    }, false);
  });
}

function _rowToObject(row) {
  var keys = Object.keys(row._data);
  var returnObj = { 
    id: row.id,
    _created_date: row._created_date,
    _last_updated_date: row._last_updated_date
  };
  keys.forEach(function(key) {
    returnObj[key] = row._data[key];
  });
  return returnObj;
}

module.exports = api;
