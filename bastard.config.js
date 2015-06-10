var conf = require('nconf');
var PostgresBastard = require('./app/postgres/postgresBastard');
//var RethinkBastard = require('./app/rethinkdb/RethinkBastard');

conf.argv().env().file('./config/' + (conf.get('NODE_ENV')||'development') + '.json');


function getDatabase() {
  return new PostgresBastard(conf.get('POSTGRES_DB'));
  //return new RethinkBastard();
}

module.exports = {
  getDatabase: getDatabase
}
