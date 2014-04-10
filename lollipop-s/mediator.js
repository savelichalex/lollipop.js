module.exports = (function(core) {
var Pubsub = require('./pubsub.js'),
	Mediator;

//Mediator is the link between modules and core.
//Implements Pub-sub pattern for communication between modules.
//Have some auxiliary functions for async implementation of MVC pattern.
Mediator = (function() {
	'use strict';
	var modules = core.modules,
		pubsub = new Pubsub(), 
		callAction,
		subscribers,
		subscribe,
		unsubscribe,
		publish;
	//The callAction needed to call action in controller (implementation of MVC)
	//TODO: change it to pub-sub
	callAction = function(moduleId, action, args, res) {
		modules[moduleId].instance.callAction(action, args, res);
	};

	return {
		callAction: callAction,
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