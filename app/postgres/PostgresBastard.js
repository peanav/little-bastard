var Promise = require('bluebird');
var DB = require('./DB');

var currentTableNames;
var scope = { user: {} };

function postgresBastard(connectionString) {
  this.DB = new DB(connectionString);
}

postgresBastard.prototype.findAll = function(tableName) {
  var query = 'SELECT * from ' + tableName + ';';

  return this.DB.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.DB.run(query).then(function(result) {
        return result.rows.map(_rowToObject);
      });
    } else {
      return Promise.reject(new Error('Table "' + tableName + '" does not exist'));
    }
  }.bind(this));
}

postgresBastard.prototype.insertDocument = function(tableName, data) {
  return this.DB.createTable(tableName).then(function() {
    var query = 'insert into ' + tableName + ' (_created_date, _last_updated_date, _data) values (' +
      'now(), now(), \'' + JSON.stringify(data) + '\') returning id, _created_date, _last_updated_date, _data;';
    return this.DB.run(query).then(function(result) {
      return _rowToObject(result.rows[0]);
    });
  }.bind(this));
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

module.exports = postgresBastard;
