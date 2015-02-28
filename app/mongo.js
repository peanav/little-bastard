var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var nconf = require('nconf');

nconf.argv().env().file('./config/' + nconf.get('NODE_ENV')  + '.json');

var url = nconf.get('DBURL');
var api = {
  getCollection: getCollection,
  getById: getById,
  insertDocument: insertDocument,
  removeDocument: removeDocument,
};

function getObjectId(id, callback) {
  try {
    return new ObjectID(id);
  } catch(err) {
    callback(new Error('Error Parsing Mongo ObjectID: ' + err.message));
  }
}

function connect(errorCallback, callback) {
  MongoClient.connect(url, function(err, db) {
    if(err) {
      errorCallback(err, null);
      return;
    }
    callback(db);
  });
}

function getCollection(collectionName, callback) {
  find(collectionName, {}, callback);
}

function getById(collectionName, id, callback) {
  findOne(collectionName, id, callback);
}

var find = function(collectionName, where, callback) {
  connect(callback, function(db) {
    var collection = db.collection(collectionName);
    collection.find(where).toArray(callback);
  });
}

function findOne(collectionName, id, callback) {
  var objectId = getObjectId(id, callback);
  objectId && connect(callback, function(db) {
    var collection = db.collection(collectionName);
    collection.findOne({_id: objectId}, {}, callback);
  });
}

function insertDocument(collectionName, document, callback) {
  connect(callback, function(db) {
    var collection = db.collection(collectionName);
    collection.insert(document, callback);
  });
}

function removeDocument(collectionName, id, callback) {
  var objectId = getObjectId(id, callback);
  objectId && connect(callback, function(db) {
    var collection = db.collection(collectionName);
    collection.remove({ _id : objectId }, callback);
  });
}

module.exports = api;
