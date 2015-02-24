var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var nconf = require('nconf');

nconf.argv().env().file('./config/' + nconf.get('NODE_ENV')  + '.json');

var url = nconf.get('DBURL');
var mongo = {
  getCollection: getCollection,
  getById: getById
};


function connect(cb) {
  MongoClient.connect(url, function(err, db) {
    if(err) { console.log('error connecting to db'); }
    cb(db);
  });
}

function getCollection(collectionName, cb) {
  find(collectionName, {}, cb);
}

function getById(collectionName, id, cb) {
  findOne(collectionName, id, cb);
}

var find = function(collectionName, where, callback) {
  connect(function(db) {
    var collection = db.collection(collectionName);
    collection.find(where).toArray(function(err, docs) {
      callback(docs);
    });
  });
}

var findOne = function(collectionName, id, callback) {
  var objId = new ObjectID(id);
  connect(function(db) {
    var collection = db.collection(collectionName);
    collection.findOne({_id: objId}, {}, function(err, doc) {
      callback(doc);
    });
  });
}



module.exports = mongo;
