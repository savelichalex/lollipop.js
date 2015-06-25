/* jshint node: true */
module.exports = function(Sandbox) {
'use strict';
var utils = require('./utils.js');

function Module(callback) {
	if(!(this instanceof Module)) {
		return new Module(callback);
	}

	this.callSuper(callback);
};

Module.extends(Sandbox);

return Module;
};