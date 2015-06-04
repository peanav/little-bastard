var rethink = require('rethinkdbdash');
var Promise = require('bluebird');


function RethinkBastard(connectionString) {
  this.r = rethink();
  this.dbName = 'test'
}

RethinkBastard.prototype._getSortObject = function(sort) {
  if(sort.order.toLowerCase() === 'desc') {
    return this.r.desc(sort.key)
  }
  return sort.key
}

RethinkBastard.prototype.findAll = function(tableName, sort) {
  return this._exists(tableName, function() {
    if(sort) {
      return this.r.table(tableName).orderBy(this._getSortObject(sort));
    } else {
      return this.r.table(tableName);
    }
  }, function() {
    return [];
  });
}

RethinkBastard.prototype.findOne = function(tableName, id) {
  return this._exists(tableName, function() {
    return this.r.table(tableName).get(id);
  }, function() {
    return null;
  });
}

RethinkBastard.prototype.find = function(tableName, filter) {}

RethinkBastard.prototype.insertDocument = function(tableName, data) {
  //Add the date to the object
  var date = new Date();
  data._created_date = date;
  data._last_updated_date = date;

  return this._tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.r.table(tableName).insert(data, { returnChanges: true }).then(function(result) {
        return result.changes[0].new_val;
      });
    } else {
      return this.r.db(this.dbName).tableCreate(tableName).then(function() {
        return this.r.table(tableName).insert(data, { returnChanges: true }).then(function(result) {
          return result.changes[0].new_val;
        });
      }.bind(this));
    }
  }.bind(this));
}

RethinkBastard.prototype.updateDocument = function(tableName, id, data) {
  return this.findOne(tableName, id).then(function(record) {
    data._last_updated_date = new Date();
    return this.r.table(tableName).get(id).update(data, { returnChanges: true }).then(function(result) {
      return result.changes[0].new_val;
    });
  }.bind(this));
}

RethinkBastard.prototype.removeDocument = function(tableName, id) {
  return this.r.table(tableName).get(id).delete()
}

RethinkBastard.prototype._getTableList = function() {
  return this.r.db(this.dbName).tableList();
}

RethinkBastard.prototype._tableExists = function(tableName) {
  function tableNameInList(list) {
    return !!list.filter(function(name) { return tableName === name; }).length;
  }

  if(this.tableList) {
    return new Promise(function(resolve) { 
      resolve(tableNameInList(this.tableList));
    }.bind(this));
  }

  return this._getTableList().then(function(list) {
    this.tableList = list;
    return tableNameInList(list);
  });
}

RethinkBastard.prototype._exists = function(tableName, trueFunction, falseFunction) {
  return this._tableExists(tableName).then(function(exists) {
    if(exists) { return trueFunction && trueFunction.apply(this); }
    return falseFunction && falseFunction.apply(this);
  }.bind(this));
}

module.exports = RethinkBastard;
