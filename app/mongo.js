var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var nconf = require('nconf');

nconf.argv().env().file('./config/' + nconf.get('NODE_ENV')  + '.json');

var url = nconf.get('DBURL');
var api = {
  getCollection: getCollection,
  getById: getById,
  insertDocument: insertDocument
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

function findOne(collectionName, id, callback) {
  // Mongo Ids must be 24 string chars
  if(id.length !== 24) { 
    callback({});
    return;
  }

  // Create an ObjectID from the string id
  var objId = new ObjectID(id);

  // Connect to the DB and preform the findOne operation
  connect(function(db) {
    var collection = db.collection(collectionName);
    collection.findOne({_id: objId}, {}, function(err, doc) {
      callback(doc || {});
    });
  });
}

function insertDocument(collectionName, document, cb) {
  connect(function(db) {
    var collection = db.collection(collectionName);
    collection.insert(document, cb);
  });
}


module.exports = api;
