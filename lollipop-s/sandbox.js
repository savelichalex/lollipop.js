/* jshint node: true */
module.exports = function(Mediator) {
'use strict';
/**
 * Sandbox it's part of every module, which add some basic functionality, 
 * like modules pubsub and etc.
 * @param {that} modules context
 * @param {callback} modules body
 */
return function Sandbox(that, callback) {
	var that = that || {},
		mediator = Mediator;

	that.log = function(message) {
		console.log(message);
	};

	/**
	 * Subscribe method use mediator to communication with other modules.
	 * This method return Promise.
	 * @param {type}
	 * @return {Promise}
	 */
	that.subscribe = function(type) {
		return mediator.subscribe(type);
	};

	/**
	 * This method publish new message to every subscribers.
	 * Use mediator.
	 * @param {type} publication type
	 * @param {publication} message body
	 */
	that.publish = function(type, publication) {
		mediator.publish(publication, type);
	};

	/**
	 * Unsubscribe all subscribers
	 * @param {String} type of publication
	 */
	that.unsubscribe = function(type) {
		mediator.unsubscribe(type);
	};

	callback.call(that);
};
};