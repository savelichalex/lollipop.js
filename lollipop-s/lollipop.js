var Lollipop = {},
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
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
			case 'controller': m.instance = Controller(m.callback); break;
			case 'model': m.instance = Model(m.callback); break;
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

Lollipop.Mediator = (function() {
	'use strict';
	var modules = Lollipop.Core.modules,
		callMethod, newModel, callAction,
		subscribers,
		subscribe,
		unsubscribe,
		publish;

	callAction = function(moduleId, action, args, res) {
		modules[moduleId].instance.callAction(action, args, res);
	};

	subscribers =  {
		any: []
	};

	subscribe = function(target, type) {
		type = type || 'any';
		if(typeof this.subscribers[type] === 'undefined') {
			this.subscribers[type] = [];
		}
		this.subscribers[type].push({
			id: target.name,
			callback: target.callback,
		});
	},

	unsubscribe = function(id) {
		var i, len, prop;

		for(i in subscribers) {
			if(subscribers.hasOwnProperty(i)) {
				prop = subscribers[i];
				len = prop.length;

				while(len--) {
					if(prop[len].id === id) {
						prop.splice(len, 1);
					}
				}
			}
		}
	},

	publish = function(publication, type) {
		var type = type || 'any',
			subscribers = this.subscribers[type],
			i = subscribers.length;

		while(i--) {
			subscribers[i].callback(publication);
		}
	}

	return {
		callAction: callAction,
		subscribers: subscribers, //del in prod
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		publish: publish,
	}
}());

function Sandbox(that, callback) {
	'use strict';
	var that = that || {},
		mediator = Lollipop.Mediator;

	that.log = function(message) {
		console.log(message);
	};

	that.subscribe = function(type, fn) {
		var target = {
			callback: fn,
		};

		mediator.subscribe(target, type);
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
		server,
		PORT = +process.env.PORT || +that.PORT || 1337,
		routes = {},
		mediator = Lollipop.Mediator;

	that.server = (function() {
		http.createServer(function(req, res) {
			var pathname = url.parse(req.url).pathname,
				i, match = false, params = [];
			for(i in routes) {
				if(routes.hasOwnProperty(i)) {
					//regexp must be correct ->
					if(routes[i].regexp.test(pathname) || pathname === i) {
						match = true;
						params = pathname.slice(i.length).split('/');
						mediator.callAction(routes[i].controller, routes[i].action, params, res);
					}
				}
			}
			if(!match) {
				//404
				fs.readFile('view/404.html', function(err, data) {
					res.writeHead(404);
					res.end(data);
				});
			}
		}).listen(PORT);
	}());

	that.routes = {
		add: function(uri, callback) {
			var actions = [], params = [],
				len, i, handle,
				callback_params,
				params_str;

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
						params.push(actions[len]);
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
			len = params.length;
			if(len = 0) {
				params_str = '';
			} else {
				for(i = 0; i < len; i += 1) {
					params_str += '\/[\\w\\d\_]+';
				}
			}
			
			routes[handle] = {
				controller: callback_params[0],
				action: callback_params[1],
				params: params,
				regexp: new RegExp("^/"+handle.replace('/', '\/')+params_str+'$')
			}
		}
	};
	that.route = that.routes.add;

	Sandbox(that, callback);
}

function Controller(callback) {
	'use strict';

	if(!(this instanceof Controller)) {
		return new Controller(callback);
	}

	var that = {}, actions = {},
		parseTemplate,
		mediator = Lollipop.Mediator;

	that.setAction = function(actionId, callback) {
		actions[actionId] = callback;
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
				var path = 'view/' + filename + '.html', //hardcode!!!
					template;
				fs.readFile(path, function(err, data) {
					if(err) {
						res.end(404);
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

function Model(callback) {
	'use strict';
	if(!(this instanceof Model)) {
		return new Model(callback);
	}

	var that = {},
		methods = {},
		mongo, db,
		collection;

	that.setMethod = function(methodId, callback) {
		methods[methodId] = callback;
	};

	that.NewMongoConnection = function(host, PORT) {
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

	that.MongoQuery = function(action, query, callback) {
		if(!mongo) throw "Mongo don't connect to server";
		if(!db) throw "Db don't found";
		if(!collection) throw "Collection don't found";
		mongo.open(function(err, mongo) {
			switch(action) {
				case 'find': collection.find(query, callback); break;
				case 'findOne': collection.findOne(query, callback); break;
				case 'update': collection.update(query, callback); break;
				case 'insert': collection.insert(query, callback); break;
			};
			that.mongo = mongo;
		});
	};

	Sandbox(that, callback);
}

module.exports = Lollipop;