/* jshint node: true */
module.exports = (function() {
'use strict';
var Pubsub = require('./pubsub.js'),
	util = require('./utils.js'),
	Mediator, 
	currentMediator;

//Mediator is the link between modules and core.
//Extends Pub-sub pattern for communication between modules.
//Have some auxiliary functions for async implementation of MVC pattern.
Mediator = function() {
	this.callSuper(); //TODO: parent constructor must be calling
};

Mediator.extends(Pubsub);

//Mediator is singleton
if(currentMediator === void 0)
	return currentMediator = new Mediator();
else
	return currentMediator;
}());