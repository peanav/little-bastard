var pg = require('pg');

var conString = "postgres://localhost/test";
var currentTableNames;

var api = {
  run: run,
  getAll: getAll,
  getById: getById,
  getWithFilter: getWithFilter,
  insertDocument: insertDocument,
  updateDocument: updateDocument,
  removeDocument: removeDocument
}

run("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';", function(err, result) {
  currentTableNames = result.rows.map(function (row) { return row.table_name; });
  //console.log('Current tables in schema', currentTableNames);
  //currentTableNames.forEach(function(name) {
    //run('DROP TABLE ' + name);
  //});
});

function run(query, callback) {
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    client.query(query, function(err, result) {
      if(err) {
        //return console.error('error running query', err);
      }
      client.end();
      callback && callback(err, result);
    });
  });
}

function getAll(tableName, callback) {
  if(!_tableExists(tableName)) {
    return callback(new Error('Resource "' + tableName + '" does not exist'));
  }
  run('select * from ' + tableName, function(err, result) {
    callback(null, result.rows.map(_rowToObject));
  });
}

function getById(tableName, id, callback) {
  run("select * from " + tableName + " where id='" + id + "'", function(err, result) {
    if(!result || !result.rows) { callback(new Error("Row with id: " + id + " not found")); }
    callback(null, result.rows.map(_rowToObject));
  });
}

function getWithFilter(tableName, filter, callback) {
  run("select * from " + tableName + " where _data @> '" + JSON.stringify(filter) + "'", function(err, result) {
    callback(null, result.rows.map(_rowToObject));
  });
}

function insertDocument(tableName, data, callback) {
  createTable(tableName, function(result) {
    var query = 'insert into ' + tableName + ' (_created_date, _last_updated_date, _data) values (' +
      'now(), now(), \'' + JSON.stringify(data) + '\') returning id, _created_date, _last_updated_date, _data;';
    run(query, function (err, result) {
      callback(err, _rowToObject(result.rows[0]));
    });
  });
}

function updateDocument(tableName, id, data, callback) {
  var query = "update " + tableName + " set _last_updated_date=now(), _data='" +
    JSON.stringify(data) + "' where id='" + id + "';";
  run(query, function (err, result) {
    callback(err, result.rowCount);
  });
}

function removeDocument(tableName, id, callback) {
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
  if(_tableExists(tableName)) {
    callback && callback();
    return;
  }

  var query = '' +
    'create table ' + tableName + '(' +
    'id uuid primary key default uuid_generate_v4(),' +
    '_created_date timestamp not null,' +
    '_last_updated_date timestamp not null,' +
    '_data jsonb not null);';

  run(query, function(err, result) {
    if(err) { return callback(err); }
    currentTableNames.push(tableName);
    callback(result);
  });
}

function _tableExists(tableName) {
  return currentTableNames.reduce(function(memo, name) {
    if(!memo) {
      memo = name === tableName;
    }
    return memo;
  }, false);
}

function _rowToObject(row) {
  console.log(row);
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
