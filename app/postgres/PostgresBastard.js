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

postgresBastard.prototype.findOne = function(tableName, id) {
  var query = "select * from " + tableName + " where id='" + id + "';";

  return this.DB.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.DB.run(query).then(function(result) {
        if(!result || !result.rows || !result.rows.length) { 
          return Promise.reject(new Error('Row with id: ' + id + ' not found in table "' + tableName + '"'));
        }
        return _rowToObject(result.rows[0]);
      });
    } else {
      return Promise.reject(new Error('Table "' + tableName + '" does not exist'));
    }
  }.bind(this));
}

postgresBastard.prototype.find = function(tableName, filter) {
  var query = "select * from " + tableName + " where _data @> '" + JSON.stringify(filter) + "';";

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

postgresBastard.prototype.updateDocument = function(tableName, id, data) {
  var query = "update " + tableName + " set _last_updated_date=now(), _data='" +
    JSON.stringify(data) + "' where id='" + id + "';";
  return this.DB.run(query).then(function (result) {
    return result.rowCount;
  });
}

postgresBastard.prototype.removeDocument = function(tableName, id) {
  var query = "delete from " + tableName + " where id='" + id + "';";
  return this.DB.run(query).then(function(result) {
    if(result.rowCount === 1) {
      return {message: "Successfully removed row \"" + id + "\" from table " + tableName };
    } else {
      return Promise.reject(new Error("Did not remove a row"));
    }
  });
}

function _rowToObject(row) {
  var keys = Object.keys(row._data);
  var returnObj = { 
    _id: row.id,
    _created_date: row._created_date,
    _last_updated_date: row._last_updated_date
  };
  keys.forEach(function(key) {
    returnObj[key] = row._data[key];
  });
  return returnObj;
}

module.exports = postgresBastard;
