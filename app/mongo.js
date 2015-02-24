var MongoClient = require('mongodb').MongoClient;
var nconf = require('nconf');

nconf.argv().env().file('./config/' + nconf.get('NODE_ENV')  + '.json');

var url = nconf.get('DBURL');
var mongo = {
  getCollection: getCollection
};


function connect(cb) {
  MongoClient.connect(url, function(err, db) {
    if(err) { console.log('error connecting to db'); }
    cb(db);
  });
}

function getCollection(collectionName, cb) {
  connect(function(db) {
    find(db, collectionName, {}, cb);
  });
}

var find = function(db, collectionName, where, callback) {
  var collection = db.collection(collectionName);
  collection.find(where).toArray(function(err, docs) {
    callback(docs);
  });
}



module.exports = mongo;
