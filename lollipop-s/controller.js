/* jshint node: true */
module.exports = function(Sandbox, Lollipop) {
'use strict';
var utils = require('./utils.js'),
	PromiseWrapper = require('./promiseWrapper.js'),
	Promise = require('./promise.js'),
	fs = require('fs');
/**
 * Controller this is link beetwen Model and View.
 * Add some function to module context, like setAction.
 * Also add function callMethod to Promise, to use 
 * cascade with actions.
 * @param {name} String; aka moduleId
 * @param {callback} Function; module body
 */
function Controller(name, callback) {
	if(!(this instanceof Controller)) {
		return new Controller(name, callback);
	}

	var actions = {},
		parseTemplate,
		self = this,
		//actions context
		obj = function(res, actionId) {
			return {
			/**
			 * This function call html base view.
			 * Also render object in view.
			 * @param {filename} name of view file,
			 * default - action id
			 * @param {obj} object to render view
			 */
			render: function(filename, obj) {
				if(typeof filename === 'object') {
					var obj = filename,
						filename = actionId;
				} else {
					var filename = filename || actionId;
				}
				var path = Lollipop.PATH + '/app/views/' + filename + '.html', //hardcode!!!
					template;
				fs.readFile(path, function(err, data) {
					if(err) {
						res.end();
					} else {
						template = parseTemplate(data, obj);
						res.writeHead(200, {'Content-type': 'text/html'});
						res.end(template);
					}
				});
			},
			/**
			 * Render view in json format
			 * @param {obj} object to render
			 */
			json: function(obj) {
				var str = JSON.stringify(obj);
				res.writeHead(200, {'Content-type': 'text/json'});
				res.end(str);
			},
			}
		};
	/**
	 * Set new action to controller.
	 * Subscribe to start event from server.
	 * @param {actionId} String; needed to right routing
	 * @return PromiseWrapper
	 */
	this.setAction = function(actionId) {
		var type = name + ':' + actionId,
			wrapper = new PromiseWrapper();

		this.subscribe(type, function() {
				var args = Array.prototype.slice.call(arguments);
				var res = args.pop();
				wrapper.accept(new Promise(function(resolve) {
					resolve([obj(res, actionId), args[0]]);
				})); 
		});

		return wrapper;
	};

	/**
	 * Add function that call Model method.
	 * Use promise to allow cascade style.
	 * @param {moduleId} String
	 * @param {method} String
	 * @return PromiseWrapper
	 */
	PromiseWrapper.prototype.callMethod = function(moduleId, method) {
		var _methodAnswer;

		return this.then(function() {
			var args = Array.prototype.slice.call(arguments),
				context = args.shift(),
				args = args.pop(),
				data = args[0],
				res = args[1];

			return new Promise(function(resolve, reject) {
				_methodAnswer = function(data) {
					resolve([context, data]);
				}
				self.publish('callModel', {
					model: moduleId,
					method: method,
					cb: _methodAnswer,
					data: data,
					res: res
				});
			});
		});

		/*return new PromiseWrapper(this.promise.then(function() {
			that.publish('callMethod', args); //call ModelQueryManadger <-
			var context = args.shift(); //                               |
			return that.subscribe(stop) // -------------------------------
						.then(function(data) {
							return [context, data];
						});
		})); */
	};

	/**
	 * Function to render view. Replace '{{property}}' to object property
	 * @param {data} String; html file
	 * @param {obj} Object; object to replace
	 * @return String; rendered html file
	 */
	parseTemplate = function(data, obj) {
		if(!obj || obj.length === 0) {
			return data;
		}
		var template_regexp = /\{\{([\w\d]+)\}\}/g;

		data = data + '';
		data = data.replace(template_regexp, function() {
			var entry = Array.prototype.slice.call(arguments)[1],
				val = obj[entry];
			if(val) {
				return val;
			} else {
				return '';
			}
		});

		return data;
	};

	this.callSuper(callback);
};

Controller.extends(Sandbox);

return Controller;
};