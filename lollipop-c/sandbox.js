function Sandbox(name, modules, context, callback) {
	'use strict';
	var i, 
		that = context, 
		mediator = Lollipop.Mediator, 
		self = this;

	if(!(this instanceof Sandbox)) {
		return new Sandbox(name, modules, that, callback);
	}

	this.eventListeners = [];
	//тут можно реализовать какие либо возможности для общения с медиатором

	//метод подписки на событие
	that.subscribe = function(type, fn) {
		var target;

		target = {
			name: this.getName(),
			callback: fn,
		};

		mediator.subscribe(target, type);
	};

	//создание события
	that.publish = function(type, publication) {
		mediator.publish(publication, type);
	};

	that.on = function(el, type, fn, phase) {
		phase = phase || false;

		self.eventListeners.push({
			type: type,
			element: el,
			callback: fn,
			phase: phase,
		});

		el.addEventListener(type, fn, phase);
	} //need be in lirary fasad and cross-browser

	that.getName = function() {
		return name;
	};

	this.purgeEventListeners = function() {
		var	list = this.eventListeners,
			i = list.length;

		while(i--) {
			list[i].element.removeEventListener(list[i].type, list[i].callback, list[i].phase);
		}
	}

	if(!modules || modules[0] === '*') {
		modules = [];
		for(i in Sandbox.modules) {
			if(Sandbox.modules.hasOwnProperty(i)) {
				modules.push(i);
			}
		}
	}

	for(i = 0; i < modules.length; i += 1) {
		that[modules[i]] = Sandbox.modules[modules[i]];
	}

	callback.call(that);
}

Sandbox.prototype = {
	name: "My Application",
	version: "1.0"
}

Sandbox.modules = {
	ajax: (function() {
		var xhr, post;

		try {
			xhr = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(E) {
				xhr = false;
			}
		}
		if(!xhr && typeof XMLHttpRequest !== "undefined") {
			xhr = new XMLHttpRequest();
		}

		post = function(data, url, context, success, error) {
			var type = 'POST';
			xhr.open(type, url, true);
			xhr.onreadystatechange = function() {
				if(xhr.readyState === 4) {
					if(xhr.status === 200) {
						success.call(context, xhr.responseText);
					} else {
						error.call(context, xhr.responseText);
					}
				}
			}
			xhr.send(data);
		}

		return {
			post: post,
		};
	}()),

	$: function(el) {
		return document.getElementById(el);
	}
}

function Widget() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
		callback = args.pop(),
		name = args.shift(),
		modules = (args[0] && typeof args[0] === 'string') ? args : args[0],
		that = {},
		template,
		container = document,
		publish;

	that.container = function(node) {
		container = node;
		return this;
	};

	publish = function(element, publication, context) {
		var el = context.View.getElement(element),
			callback = context.ViewModel.observable[element],
			arr = context.ViewModel.subscribers[element],
			i, len;

		callback.call(el, publication);

		if(arr && arr.length !== 0) {
			for(i = 0, len = arr.length; i<len; i += 1) {
				arr[i].callback.call(arr[i].el, publication);
			}
		}
	};

	that.Element = function(scop) {
		var prop,
			obj = {},
			template,
			viewModel = {},
			Model = {},
			View = {},
			renderTemplate,
			template_regexp = /(\{\{(\w\d+)\}\})/g,
			setViewElements;

		if(Object.prototype.toString.call(obj) !== "[object Object]") {
			return false;
		}

		renderTemplate = function(text, model) {
			text = text.replace(template_regexp, function() {
				var entry = Array.prototype.slice.call(arguments)[2],
					val = model.get(entry);
				if(val) {
					return val;
				} else {
					return '';
				}
			});

			return text;
		};

		setViewElements = function(wrap, hasTemplate) {
			var i, els, len, elems = {},
				property, hasTemplate = hasTemplate || false;

			els = wrap.getElementsByTagName('*');
			for(i = 0, len = els.length; i < len; i += 1) {
				elems[els[i].id] = els[i];
			}
			for(i in View) {
				if(View.hasOwnProperty(i)) {
					View[i] = elems[i];
					if(!hasTemplate) {
						property = obj.Model.get(i)
						if(property) {
							View[i].innerHTML = property;
						}
					}					
				}
			}
			elems = null;
		}

		obj.View = {
			setTemplate: function(t) {
				template = renderTemplate(t, obj.Model);
				return this;
			},
			getElement: function(p) {
				return View[p];
			},
			render: function() {
				if(template) {
					container.innerHTML += template;
					setViewElements(container, true);
				} else {
					setViewElements(container);
				}
			}
		};
		obj.ViewModel = {
			get: function(p) {
				var on,
					bind, subscribe,
					listeners = this.listeners, 
					subscribers = this.subscribers,
					observable = this.observable;

				on = function(event, callback, phase) {
					if(typeof listeners[p] === 'undefined') {
						listeners[p] = [];
					}
					
					var el = View[p];
					phase = phase || false;

					listeners[p].push({
						el: el,
						event: event,
						callback: callback,
						phase: phase
					});
					
					el.addEventListener(event, callback, phase);

					return this;
				};
				bind = function(callback) {
					observable[p] = callback;
					return this;
				};
				subscribe = function(subscriber, callback) {
					if(typeof subscribers[p] === 'undefined') {
						subscribers[p] = [];
					}
					subscribers[p].push({
						el: View[subscriber],
						callback: callback,
					});
					return this;
				};
				return {
					on: on,
					bind: bind,
					subscribe: subscribe,
				}
			},
			subscribers: {},
			listeners: {},
			observable: {},
		};
		obj.Model = {
			set: function(p, v) {
				Model[p] = v;
				publish(p, v, obj);
			},
			get: function(p) {
				var value;
				
				if(typeof Model[p] === 'function') {
					value = Model[p].call(this);
				} else {
					value = Model[p];
				}

				return value;
			},
			sync: function(prop) {
				var success,
					error,
					data = [],
					p, val, str,
					context = prop.context || that;

				if(prop.url) {
					this.url = prop.url;
				}
				if(prop.success) {
					success = prop.success;
				} else {
					success = function () {};
				}
				if(prop.error) {
					error = prop.error;
				} else {
					error = function () {};
				}
				for(p in Model) {
					if(Model.hasOwnProperty(p)) {
						val = this.get(p);
						str = p + "=" + val;
						data.push(str);
					}
				}
				this.ajax.post(data.join('&'), this.url, context, success, error);
			},
			url: null,
			ajax: Sandbox.modules.ajax,
		};

		for(prop in scop) {
			if(scop.hasOwnProperty(prop)) {
				var property = scop[prop];

				View[prop] = null;
				if(property !== undefined && property !== null) {
					Model[prop] = property;
				}
				
			}
		}

		return obj;
	};

	return new Sandbox(name, modules, that, callback);
}

function Module() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
		callback = args.pop(),
		name = args.shift(),
		modules = (args[0] && typeof args[0] === 'string') ? args : args[0],
		that = {};

	that.helper = function() {
		return "This is helper";
	};

	return new Sandbox(name, modules, that, callback);
}