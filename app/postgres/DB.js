var pg = require("pg");
var Promise = require("bluebird");
Promise.promisifyAll(pg);


function DB(connectionString) {
  this.connectionString = connectionString;
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
        '_data jsonb not null);';
      return this.run(query).then(function() {
        if(!this.currentTableNames) { this.currentTableNames = []; }
        this.currentTableNames.push(tableName);
      }.bind(this));
    }
  }.bind(this));

  return this.run(query);
}

DB.prototype._getCurrentTableNames = function() {
  var tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';";

  if(this.currentTableNames) {
    return new Promise(function(resolve) {
      resolve(this.currentTableNames);
    });
  }

  return this.run(tableQuery).then(function(result) {
    this.currentTableNames = result.rows.map(function (row) { return row.table_name; });
    return this.currentTableNames;

    //var promises = names.reduce(function(memo, tableName) {
      //memo[tableName] = _isUserScoped(tableName);
      //return memo;
    //}, {});

    //return Promise.props(promises).then(function(results) {
      //scope.user = results;
      //return names;
    //});
  });
}

module.exports = DB;
