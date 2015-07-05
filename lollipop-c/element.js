var Lollipop = Lollipop || {};

Lollipop.Element = function() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
			creator = args.pop(),
			moduleId = args.shift(),
			deps = (args[0] && typeof args[0] === 'string') ? args : ['*'],
			type = 'element',
			core = Lollipop.Core;

	core.register(moduleId, type, deps, creator);
};

function Element() {
	'use strict';

	var args = Array.prototype.slice.call(arguments),
		callback = args.pop(),
		name = args.shift(),
		modules = (args[0] && typeof args[0] === 'string') ? args : args[0],
		scope = {},
		template,
		publish;

	//HTML Import
	template = document.createElement('link');
	template.rel = 'import';
	template.href = name + '-template.html';
	template.onload = function() {
		var t = template.import.getElementsByTagName('template')[0],
			clone = document.importNode(t.content, true);
		el_shadow.appendChild(clone);
	};	
	document.body.appendChild(template);

	//Register element and create shadowDOM
	document.registerElement(name);
	var el = document.getElementsByTagName(name)[0];
	var el_shadow = el.createShadowRoot();


	return new Sandbox(name, modules, scope, callback);
}