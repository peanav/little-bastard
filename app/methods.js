var utils = require('./utils');
var mongo = require('./mongo');

var methods = {};

methods.get = function(req, res) {
  var parts = req.path.split('/').filter(utils.isTruthy);

  if(parts.length === 1) {
    // Get All Documents
    mongo.get(parts[0], function(items) {
      res.json(items);
    });
  } else if(parts.length === 2) {
    // Get Document By Id
  } else {
    // Get Documents By Search
  }

}

module.exports = methods;
