var Promise = require('bluebird');
var _ = require('lodash');
var DB = require('./DB');

var currentTableNames;
var scope = { user: {} };

function postgresBastard(connectionString) {
  this.DB = new DB(connectionString);
}

function addSortByToQuery(query, sort) {
  if(!sort) { return query; }
  if(sort) {
    query += ' ORDER BY _data->\'' + sort.key + '\' ' + sort.order;
  }
  query += ';';
  return query;
}

postgresBastard.prototype.findAll = function(tableName, user, sort) {
  var query = addSortByToQuery('SELECT * FROM ' + tableName + ' WHERE _created_by_id=\'' + user._id + '\'', sort);

  return this.DB.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.DB.run(query).then(function(result) {
        return result.rows.map(_rowToObject);
      });
    } else {
      return [];
    }
  }.bind(this));
}

postgresBastard.prototype.findOne = function(tableName, id, user) {
  var query = "select * from " + tableName + " where id='" + id + "' AND _created_by_id='" + user._id + "';";

  return this.DB.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.DB.run(query).then(function(result) {
        if(!result || !result.rows || !result.rows.length) { 
          return Promise.reject(new Error('Row with id: ' + id + ' not found in table "' + tableName + '"'));
        }
        return _rowToObject(result.rows[0]);
      });
    } else {
      return Promise.reject(new Error('Row with id: ' + id + ' not found in table "' + tableName + '"'));
    }
  }.bind(this));
}

postgresBastard.prototype.find = function(tableName, user, filter, sort) {
  var whereClause = {
    _data: JSON.stringify(filter),
    _created_by_id: user._id
  };

  if(tableName === 'app_users') {
    delete whereClause._created_by_id;
  }

  var where = _.map(whereClause, _objectToString).join(' and ');

  var query = addSortByToQuery("select * from " + tableName + " where " + where, sort);

  return this.DB.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.DB.run(query).then(function(result) {
        return result.rows.map(_rowToObject);
      });
    } else {
      return [];
    }
  }.bind(this));

  function _objectToString(value, key) {
    var operator = (key === '_data' ? '@>' : '=');
    if(_.isNaN(+value) && value !== "now()") { return key + operator + "'" + value + "'"; }
    return key + operator + value;
  }
}

postgresBastard.prototype.insertDocument = function(tableName, user, data) {
  return this.DB.createTable(tableName).then(function() {
    var insertParams = {
      _created_date: "now()",
      _last_updated_date: "now()",
      _data: "'" + JSON.stringify(data) + "'"
    }

    if(tableName !== 'app_users') {
      insertParams._created_by_id = "'" + user._id + "'";
    }

    var columns = [], values = [];
    for(column in insertParams) {
      columns.push(column);
      values.push(insertParams[column]);
    }

    var query = 'insert into ' + tableName + ' (' + columns.join(',') + ') values (' +
      values.join(',') + ') returning id, ' + columns.join(',') + ';';
    return this.DB.run(query).then(function(result) {
      return _rowToObject(result.rows[0]);
    });
  }.bind(this));
}

postgresBastard.prototype.updateDocument = function(tableName, id, user, data) {
  var updateParams = {
    _last_updated_date: "now()",
    _data: JSON.stringify(data)
  }

  var whereClause = {
    id: id,
    _created_by_id: user._id
  };

  if(tableName === 'app_users') { delete whereClause._created_by_id; }

  var values = _.map(updateParams, _objectToString).join(',');
  var where = _.map(whereClause, _objectToString).join(' and ');

  var query = "update " + tableName + " set " + values + " where " + where;
  return this.DB.run(query).then(function (result) {
    return result.rowCount;
  });

  function _objectToString(value, key) {
    if(_.isNaN(+value) && value !== "now()") { return key + "='" + value + "'"; }
    return key + '=' + value;
  }
}

postgresBastard.prototype.removeDocument = function(tableName, id, user) {
  var query = "delete from " + tableName + " where id='" + id + "' and _created_by_id='" + user._id + "';";
  return this.DB.run(query).then(function(result) {
    if(result.rowCount === 1) {
      return {message: "Successfully removed row \"" + id + "\" from table " + tableName };
    } else {
      return Promise.reject(new Error("Did not remove a row"));
    }
  });
}

postgresBastard.prototype.addUserScope = function(tableName) {
  return this.DB.addUserScopeToTable(tableName);
}

postgresBastard.prototype.getScope = function(tableName) {
  return this.DB._getCurrentTableNames().then(function() {
    return this.DB.scope;
  }.bind(this));
}

function _rowToObject(row) {
  var keys = Object.keys(row._data);
  var returnObj = { 
    _id: row.id,
    _created_date: row._created_date,
    _last_updated_date: row._last_updated_date
  };

  if(row._created_by_id) {
    returnObj._created_by_id = row._created_by_id
  }

  keys.forEach(function(key) {
    returnObj[key] = row._data[key];
  });
  return returnObj;
}

module.exports = postgresBastard;
