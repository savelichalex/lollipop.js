/* jshint node: true */
module.exports = function(mediator) {
'use strict';
/**
 * Sandbox it's part of every module, which add some basic functionality, 
 * like modules pubsub and etc.
 * @param {that} modules context
 * @param {callback} modules body
 */
var Sandbox = function(cb) {
	cb.call(this);
}

Sandbox.prototype = {
	constructor: Sandbox,

	/**
	 * Incapsulate log method
	 * @param {message} what you want to log
	 */
	log: function(message) {
		console.log(message);
	},

	/**
	 * Subscribe method use mediator to communication with other modules.
	 * This method return Promise.
	 * @param {type}
	 */
	subscribe: function(type, cb) {
		mediator.subscribe(type, cb);
	},

	/**
	 * This method publish new message to every subscribers.
	 * Use mediator.
	 * @param {type} publication type
	 * @param {publication} message body
	 */
	publish: function(type, publication) {
		mediator.publish(type, publication);
	},

	/**
	 * Unsubscribe all subscribers
	 * @param {String} type of publication
	 */
	unsubscribe: function(type) {
		mediator.unsubscribe(type);
	}
};

return Sandbox
};