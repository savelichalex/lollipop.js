/* jshint node: true */
module.exports = function(Sandbox, Mediator) {
'use strict';
return function Router(callback) {
	if(!(this instanceof Router)) {
		return new Router(callback);
	}

	var that = {},
		routes = {},
		server = require('./server.js')(Mediator),
		Server;

	that.routes = {
		add: function(uri, callback) {
			var actions = [], params = [],
				len, handle,
				callback_params,
				handle_str;

			if(/[^\w\d\/\:\_]+/.test(uri)) {
				throw new Error('not valid uri');
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
				throw new Error('not valid callback');
			}

			callback_params = callback.split('#');

			if(!callback_params[1]) {
				throw new Error('action not enter');
			} else if (!callback_params[0]) {
				throw new Error('controller not enter');
			}

			//regexp string to action parametrs
			handle_str = handle;
			handle_str = handle_str.replace(/\:[a-zA-Z0-9]+/g, '([\\w\\d\_]+)').replace(/\//g, '\\/'); /*jshint ignore:line */
			
			routes[handle] = {
				controller: callback_params[0],
				action: callback_params[1],
				params: params,
				regexp: new RegExp('^' + handle_str +'$')
			}
		}
	};
	that.route = that.routes.add;

	that.startServer = function() {
		Server = server(routes);
	}

	Sandbox(that, callback);
};
};