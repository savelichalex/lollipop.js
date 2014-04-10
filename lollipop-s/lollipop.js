/* jshint node: true */
module.exports = (function() {
'use strict';
var Lollipop = {},
	fs = require('fs'),
	q = require('./promise.js'),
	mediator = require('./mediator.js'),
	core = require('./core.js'),
	sandbox = require('./sandbox.js'),
	router = require('./router.js'),
	controller = require('./controller.js'),
	model = require('./model.js'),
	module = require('./module.js'),
	Sandbox, Router,
	Controller, Model,
	Module;

Lollipop.Module = function(moduleId, callback) {
	Lollipop.Core.register('module', moduleId, callback);
};

Lollipop.Router = function(callback) {
	Lollipop.Core.register('router', 'router', callback);
};

Lollipop.Controller = function(moduleId, callback) {
	Lollipop.Core.register('controller', moduleId, callback);
};

Lollipop.Model = function(moduleId, callback) {
	Lollipop.Core.register('model', moduleId, callback);
};

Lollipop.Mediator = mediator();

Sandbox = sandbox(Lollipop.Mediator);

Module = module(Sandbox);

Router = router(Sandbox, Lollipop.Mediator);

Controller = controller(Sandbox, Lollipop);

Model = model(Sandbox, q);

Lollipop.Core = core(Module, Router, Controller, Model);

return Lollipop;

}());