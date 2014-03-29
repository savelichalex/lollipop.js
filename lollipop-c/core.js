Lollipop = Lollipop || {};

Lollipop.Core = (function() {
	'use strict';
	var register, start, stop,
		startAll, stopAll,
		modules = {},
		i,
		mediator = Lollipop.Mediator;

	register = function(moduleId, type, deps, creator) {
		modules[moduleId] = {
			type: type,
			deps: deps,
			creator: creator,
			instance: null,
		}
	};

	start = function(moduleId) {
		var m = modules[moduleId];
		if(m.instance === null) {
			switch(m.type) {
				case 'widget': m.instance = Widget(moduleId, m.deps, m.creator); break;
				case 'module': m.instance = Module(moduleId, m.deps, m.creator); break;
				case 'router': m.instance = Router(moduleId, m.deps, m.creator); break;
			}
		}
	};

	stop = function(moduleId) {
		mediator.unsubscribe(moduleId);
		modules[moduleId].instance.purgeEventListeners();
		modules[moduleId].instance = null;
	};

	startAll = function() {
		for(i in modules) {
			if(modules.hasOwnProperty(i)) {
				this.start(i);
			}
		}
	};

	stopAll = function() {
		for(i in modules) {
			if(modules.hasOwnProperty(i)) {
				this.stop(i);
			}
		}
	};

	return {
		register: register,
		start: start,
		stop: stop,
		startAll: startAll,
		stopAll: stopAll,
		modules: modules //need to be deleted in prod
	}
}());

Lollipop.Widget = function() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
			creator = args.pop(),
			moduleId = args.shift(),
			deps = (args[0] && typeof args[0] === 'string') ? args : ['*'],
			type = 'widget',
			core = Lollipop.Core;

	core.register(moduleId, type, deps, creator);
};

Lollipop.Module = function() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
			creator = args.pop(),
			moduleId = args.shift(),
			deps = (args[0] && typeof args[0] === 'string') ? args : ['*'],
			type = 'module',
			core = Lollipop.Core;

	core.register(moduleId, type, deps, creator);
};

Lollipop.Router = function() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
			creator = args.pop(),
			moduleId = 'router',
			deps = (args[0] && typeof args[0] === 'string') ? args : ['*'],
			type = 'router',
			core = Lollipop.Core;

	core.register(moduleId, type, deps, creator);
};