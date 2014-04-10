/* jshint node: true */
module.exports = function(Sandbox, Lollipop) {
'use strict';
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
		obj = function(res, actionId) {
			return {
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
			json: function(obj) {
				var str = JSON.stringify(obj);
				res.writeHead(200, {'Content-type': 'text/json'});
				res.end(str);
			},
			}
		};

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

	q.promise.prototype.callMethod = function(moduleId, method, callback) {
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