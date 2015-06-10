var pg = require("pg");
var Promise = require("bluebird");
Promise.promisifyAll(pg);


function DB(connectionString) {
  this.connectionString = connectionString;
  this.scope = {};
}

DB.prototype.connect = function() {
  var close;
  return pg.connectAsync(this.connectionString).spread(function(client, done) {
    close = done;
    return client;
  }).disposer(function() {
    if (close) close();
  });
}

DB.prototype.run = function(query) {
  return Promise.using(this.connect(), function(client) {
    return new Promise(function(resolve, reject) {
      console.log(query);
      client.query(query, function(err, result) {
        if(err) { reject('error running query', err); }
        resolve(result);
      });
    });
  }).then(function(result) {
    return result;
  });
}

DB.prototype.tableExists = function(tableName) {
  return this._getCurrentTableNames().then(function(names) {
    return !!names.filter(function(name) { return tableName === name; }).length;
  });
}

DB.prototype.createTable = function(tableName) {

  return this.tableExists(tableName).then(function(exists) {
    if(exists) {
      return 'hello';
    } else {
      var query = '' +
        'create table ' + tableName + '(' +
        'id uuid primary key default uuid_generate_v4(),' +
        '_created_date timestamp not null,' +
        '_last_updated_date timestamp not null,' +
        (tableName === 'app_users' ? '' : '_created_by_id uuid not null references app_users(id),') +
        '_data jsonb not null);';
      return this.run(query).then(function() {
        if(!this.currentTableNames) { this.currentTableNames = []; }
        this.currentTableNames.push(tableName);
      }.bind(this));
    }
  }.bind(this));

  return this.run(query);
}

DB.prototype.addUserScopeToTable = function(tableName) {
  var query = '' +
    'alter table ' + tableName + ' ' +
    'add column _user_id uuid not null references app_users(id);';

  console.log(query);

  return this.tableExists(tableName).then(function(exists) {
    if(exists) {
      return this.run(query);
    } else {
      return this.createTable(tableName).then(function() {
        return this.run(query);
      }.bind(this));
    }
  }.bind(this));

}

DB.prototype._isUserScoped = function(tableName) {
  return this._getTableSchema(tableName).then(function(schema) {
    return schema.filter(function(columnName) {
      return columnName === '_user_id';
    }).length > 0;
  });
}

DB.prototype._getTableSchema = function(tableName) {
  var tableSchemaQuery = "select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name = '" + tableName + "';";
  return this.run(tableSchemaQuery).then(function(res) {
    return res.rows.map(function(column) { return column.column_name; });
  });
}

DB.prototype._getCurrentTableNames = function() {
  var tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';";
  var self = this;

  if(self.currentTableNames) {
    return new Promise(function(resolve) {
      resolve(self.currentTableNames);
    });
  }

  return this.run(tableQuery).then(function(result) {
    self.currentTableNames = result.rows.map(function (row) { return row.table_name; });

    var promises = self.currentTableNames.reduce(function(memo, tableName) {
      memo[tableName] = self._isUserScoped(tableName);
      return memo;
    }, {});

    return Promise.props(promises).then(function(results) {
      self.scope.user = results;
      return self.currentTableNames;
    });
  });
}

module.exports = DB;
