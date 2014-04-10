var Lollipop = {},
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	q = require('./promise.js'),
	pubsub = require('./pubsub.js'),
	mediator = require('./mediator.js'),
	MongoClient = require('mongodb').MongoClient,
	Server = require('mongodb').Server;

Lollipop.Module = function(moduleId, callback) {
	Lollipop.Core.register('module', moduleId, callback);
}

Lollipop.Router = function(callback) {
	Lollipop.Core.register('router', 'router', callback);
}

Lollipop.Controller = function(moduleId, callback) {
	Lollipop.Core.register('controller', moduleId, callback);
}

Lollipop.Model = function(moduleId, callback) {
	Lollipop.Core.register('model', moduleId, callback);
}

Lollipop.Core = (function() {
	'use strict';
	var modules = {},
		i,
		register,
		start, startAll,
		callAction;
	
	register = function(type, moduleId, callback) {
		modules[moduleId] = {
			type: type,
			callback: callback,
			instance: null
		};
	};
	start = function(moduleId) {
		var m = modules[moduleId];
		switch(m.type) {
			case 'module': m.instance = Module(m.callback); break;
			case 'router': m.instance = Router(m.callback); break;
			case 'controller': m.instance = Controller(moduleId, m.callback); break;
			case 'model': m.instance = Model(moduleId, m.callback); break;
		}
	};
	startAll = function() {
		for(i in modules) {
			if(modules.hasOwnProperty(i)) {
				this.start(i);
			}
		}
	};

	return {
		register: register,
		start: start,
		startAll: startAll,
		callAction: callAction,
		modules: modules,
	}
}());

Lollipop.Mediator = mediator(Lollipop.Core);

function Sandbox(that, callback) {
	'use strict';
	var that = that || {},
		mediator = Lollipop.Mediator;

	that.log = function(message) {
		console.log(message);
	};

	that.subscribe = function(type) {
		//target???
		return mediator.subscribe(type);
	};

	that.publish = function(type, publication) {
		mediator.publish(publication, type);
	};

	callback.call(that);
}

function Module(callback) {
	'use strict';

	if(!(this instanceof Module)) {
		return new Module(callback);
	}

	var that = {};

	Sandbox(that, callback);
}

function Router(callback) {
	'use strict';

	if(!(this instanceof Router)) {
		return new Router(callback);
	}

	var that = {},
		routes = {},
		server = require('./server.js')(Lollipop.Mediator),
		Server,
		mediator = Lollipop.Mediator;

	that.routes = {
		add: function(uri, callback) {
			var actions = [], params = [],
				len, i, handle,
				callback_params,
				params_str,
				handle_str;

			if(/[^\w\d\/\:\_]+/.test(uri)) {
				throw new Error("not valid uri");
			}

			if(uri === '/') {
				handle = '/';
			} else {
				actions = uri.split('/');
				len = actions.length;
				while(len--) {
					if(actions[len].indexOf(':') === 0) {
						actions.slice(len, 1);
					}
				}
				handle = '/'+actions.join('/');
			}

			if(/[^\w\d\_\#]+/.test(callback)) {
				throw new Error("not valid callback");
			}

			callback_params = callback.split('#');

			if(!callback_params[1]) {
				throw new Error('action not enter');
			} else if (!callback_params[0]) {
				throw new Error('controller not enter');
			}

			//regexp string to action parametrs
			handle_str = handle;
			handle_str = handle_str.replace(/\:[a-zA-Z0-9]+/g, '([\\w\\d\_]+)').replace(/\//g, '\\/');
			
			routes[handle] = {
				controller: callback_params[0],
				action: callback_params[1],
				params: params,
				regexp: new RegExp("^" + handle_str +'$')
			}
		}
	};
	that.route = that.routes.add;

	that.startServer = function() {
		Server = server(routes);
	}

	Sandbox(that, callback);
}

function Controller(name, callback) {
	'use strict';

	if(!(this instanceof Controller)) {
		return new Controller(name, callback);
	}

	var that = {}, actions = {},
		parseTemplate,
		mediator = Lollipop.Mediator;

	that.setAction = function(actionId, callback) {
		actions[actionId] = callback;
	};

	that.callMethod = function(moduleId, method, callback) {
		var type = moduleId + ':' + method,
			start = type + '_start',
			stop = type + '_stop';

		this.publish(start, null);
		this.subscribe(stop)
			.then(callback);
	};

	parseTemplate = function(data, obj) {
		if(!obj || obj.length === 0) {
			return data;
		}
		var template_regexp = /\{\{([\w\d]+)\}\}/g;

		data = data + "";
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

	this.callAction = function(actionId, args, res) {
		var obj = {
			render: function(filename, obj) {
				if(typeof filename === "object") {
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
						res.writeHead(200, {"Content-type": "text/html"});
						res.end(template);
					}
				});
			},
			json: function(obj) {
				var str = JSON.stringify(obj);
				res.writeHead(200, {"Content-type": "text/json"});
				res.end(str);
			},
		};
		actions[actionId].call(obj, args);
	}

	Sandbox(that, callback);
}

function Model(name, callback) {
	'use strict';
	if(!(this instanceof Model)) {
		return new Model(name, callback);
	}

	var that = {},
		methods = {},
		mongo, db,
		collection,
		connection;

	that.setMethod = function(methodId) {
		var type = name + ':' + methodId,
			start = type + '_start',
			stop = type + '_stop',
			self = this,
			defer = q.deferred();
		
		this.subscribe(start)
			.then(function() {
				defer.resolve();
			});

		q.promise.prototype.end = function() {
			this.then(function(res) {
				if(connection) {
					connection.close();
					connection = void 0;
				}
				self.publish(stop, res);
			});
		};

		return defer.promise;
	};

	that.newMongoConnection = function(host, PORT) {
		var PORT = PORT || 27017;
		mongo = new MongoClient(new Server(host, PORT), {native_parser: true});
		return {
			db: function(d) {
				db = mongo.db(d);
				return this;
			},
			collection: function(col) {
				collection = db.collection(col);
				return this;
			},
		}
	};

	/*
		if(!mongo) return new Error("Mongo don't connect to server");
		if(!db) return new Error("Db don't found");
		if(!collection) return new Error("Collection don't found"); */

	q.promise.prototype.mongoConnect = function() {
		var defer = q.deferred(),
		callback = function() {
			mongo.open(function(err, connect) {
				connection = connect;
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve();
				}
			});
		}
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.findOne = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.findOne(query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		}
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.find = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.find(query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		}
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.update = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.update(query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		}
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.insert = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.insert(query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		}
		this.deferred(callback);
		return defer.promise;
	};

	Sandbox(that, callback);
}

module.exports = Lollipop;