var utils = {};

utils.isFalsey = function(arg) { return !arg; }
utils.isTruthy = function(arg) { return !!arg; }

module.exports = utils;
