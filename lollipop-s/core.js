module.exports = function(Module, Router, Controller, Model) {
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
			case 'module': m.instance = new Module(m.callback); break;
			case 'router': m.instance = new Router(m.callback); break;
			case 'controller': m.instance = new Controller(moduleId, m.callback); break;
			case 'model': m.instance = new Model(moduleId, m.callback); break;
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
};