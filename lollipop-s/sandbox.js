/* jshint node: true */
module.exports = function(Mediator) {
'use strict';
return function Sandbox(that, callback) {
	var that = that || {},
		mediator = Mediator;

	that.log = function(message) {
		console.log(message);
	};

	that.subscribe = function(type) {
		return mediator.subscribe(type);
	};

	that.publish = function(type, publication) {
		mediator.publish(publication, type);
	};

	callback.call(that);
};
};