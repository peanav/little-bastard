var MongoClient = require('mongodb').MongoClient;
var nconf = require('nconf');

nconf.argv().env().file('./config/' + nconf.get('NODE_ENV')  + '.json');

var url = nconf.get('DBURL');
var mongo = {
  get: get
};


function connect(cb) {
  console.log(url);
  MongoClient.connect(url, function(err, db) {
    if(err) { console.log('error connecting to db'); }
    console.log('connected to db!');

    cb(db);

  });
}

function get(collectionName, cb) {
  connect(function(db) {
    find(db, collectionName, cb);
  });
}

var find = function(db, collectionName, callback) {
  var collection = db.collection(collectionName);
  collection.find({}).toArray(function(err, docs) {
    callback(docs);
  });
}




module.exports = mongo;
