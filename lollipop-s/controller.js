/* jshint node: true */
module.exports = function(Sandbox, Lollipop) {
'use strict';
/**
 * Controller this is link beetwen Model and View.
 * Add some function to module context, like setAction.
 * Also add function callMethod to Promise, to use 
 * cascade with actions.
 * @param {name} String; aka moduleId
 * @param {callback} Function; module body
 */
return function Controller(name, callback) {
	if(!(this instanceof Controller)) {
		return new Controller(name, callback);
	}

	var that = {}, 
		actions = {},
		parseTemplate,
		fs = require('fs'),
		q = require('./promise.js'),
		actionContext,
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
	 * @return Promise
	 */
	that.setAction = function(actionId) {
		var type = name + ':' + actionId,
			start = type + '_start';
		
		var defer = q.deferred();

		this.subscribe(start)
			.then(function() {
				var args = Array.prototype.slice.call(arguments[0]);
				var res = args.pop();
				defer.promise.context = actionContext = obj(res, actionId);
				defer.resolve(args);
			});

		return defer.promise;
	};

	/**
	 * Add function that call Model method.
	 * Use promise to allow cascade style.
	 * @param {moduleId} String
	 * @param {method} String
	 * @return Promise
	 */
	q.promise.prototype.callMethod = function(moduleId, method) {
		var type = moduleId + ':' + method,
			start = type + '_start',
			stop = type + '_stop',
			defer = q.deferred(),
		callback = function() {
			that.publish(start, null);
			that.subscribe(stop)
				.then(function(data) {
					defer.promise.context = actionContext;
					defer.resolve(data);
				});
		}
		this.deferred(callback);
		return defer.promise;
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

	Sandbox(that, callback);
};
};