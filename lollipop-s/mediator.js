/* jshint node: true */
module.exports = (function() {
'use strict';
var Pubsub = require('./pubsub.js'),
	Mediator;

//Mediator is the link between modules and core.
//Implements Pub-sub pattern for communication between modules.
//Have some auxiliary functions for async implementation of MVC pattern.
Mediator = (function() {
	var pubsub = new Pubsub();

	return {
		subscribe: pubsub.subscribe,
		unsubscribe: pubsub.unsubscribe,
		publish: pubsub.publish,
		subscribers: {
			any: []
		}
	}
}());

return Mediator;
});