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

		if(callback) {
			callback.call(el, publication);
		}

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
			Collection = [],
			partialView,
			renderTemplate,
			template_regexp = /\{\{([0-9a-zA-Z_]+)\}\}/g,
			setViewElements;

		if(Object.prototype.toString.call(obj) !== "[object Object]") {
			return false;
		}

		renderTemplate = function(text, model) {
			text = text.replace(template_regexp, function() {
				var entry = Array.prototype.slice.call(arguments)[1];
				if(entry === 'collection') {
					var len = Collection.length, col_str = '';
					while(len--) {
						col_str += renderTemplate(partialView, obj.Collection.next());
					}
					obj.Collection.reset();
					return col_str;
				}
				var val = model.get(entry);
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
				elems[els[i].getAttribute('data-id')] = els[i];
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
					container.innerHTML = template;
					setViewElements(container, true);
				} else {
					setViewElements(container);
				}
			},
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
				if(Object.prototype.toString.call(p) === "[object Object]") {
					Model = {};
					for(var prop in p) {
						if(p.hasOwnProperty(prop)) {
							this.set(prop, p[prop]);
						}
					}
					console.log(Model);
				} else {
					Model[p] = v;
					publish(p, v, obj);
				}
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
			toObj: function() {
				return Model;
			},
			url: null,
			ajax: Sandbox.modules.ajax,
		};

		obj.Collection = (function() {
			var index = -1,
				add, next, reset, 
				isExist, partial,
				find;

			add = function(model) {
				var temp_model, i, 
					len = model.length, prop, object;

				if(Object.prototype.toString.call(model) === "[object Array]") {
					for(i = 0; i < len; i += 1) {
						temp_model = {};
						for(prop in model[i]) {
							object = model[i];
							if(object.hasOwnProperty(prop)) {
								if(object[prop] !== undefined && object[prop] !== null) {
									temp_model[prop] = object[prop];
								}
							}
						}
						Collection.push(temp_model);
					}
				} else if(Object.prototype.toString.call(model) === "[object Object]") {
					temp_model = {};
					for(prop in model) {
						if(model.hasOwnProperty(prop)) {
							if(model[prop] !== undefined && model[prop] !== null) {
								temp_model[prop] = model[prop];
							}
						}
					}
					Collection.push(temp_model);
				} else {
					throw new TypeError();
				}
				return this;
			};
			next = function() {
				index += 1;
				return {
					get: function(prop) {
						return Collection[index][prop];
					}
				};
			};
			reset = function() {
				index = -1;
				return this;
			};
			isExist = function() {
				return Collection.length !== 0;
			};
			partial = function(p) {
				partialView = p;
				return this;
			};
			find = function(prop, val) {
				var len = Collection.length;
				while(len--) {
					if(Collection[len][prop] && Collection[len][prop] === val) {
						return Collection[len];
					}
				}
				return false;
			};

			return {
				add: add,
				next: next,
				reset: reset,
				isExist: isExist,
				partial: partial,
				find: find
			}
		}());

		if(Object.prototype.toString.call(scop) === "[object Array]") {
			obj.Collection.add(scop);
		} else {
			for(prop in scop) {
				if(scop.hasOwnProperty(prop)) {
					var property = scop[prop];

					View[prop] = null;
					if(property !== undefined && property !== null) {
						Model[prop] = property;
					}
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

function Router() {
	'use strict';
	var args = Array.prototype.slice.call(arguments),
		callback = args.pop(),
		name = args.shift(),
		modules = (args[0] && typeof args[0] === 'string') ? args : args[0],
		that = {},
		Handlers = [],
		initialize,
		routeHandler,
		hasHistory = !!window.history;

	routeHandler = function(e) {
		if(!hasHistory) {
			var hash = e;
		} else {
			var e = e || window.event,
				hash = window.location.hash;
			e.preventDefault();
		}

		var url = hash.slice(2), 
			len = Handlers.length,
			handler, static_part,
			params;

		while(len--) {
			if(Handlers[len].regexp.test(url)) {
				handler = Handlers[len];
				static_part = (handler.regexp + "/").replace('/[a-zA-Z0-9]+', '').replace('/^', '').replace('$/', '');
				params = url.slice(static_part.length).split('/');
				handler.callback.apply(that, params);
				return;
			}
		}
	};

	initialize = (function() {
		if(hasHistory) {
			window.addEventListener('hashchange', routeHandler, false);
		} else {
			var oldHash = window.location.hash;
			setInterval(function() {
				var hash = window.location.hash;
				if(hash !== oldHash) {
					routeHandler(hash);
					oldHash = hash;
				}
			}, 50);
		}
	}());

	that.route = function(uri, callback) {
		var params = uri.split('/'),
			len = params.length,
			params_number = 0, named_params_str = '';

		while(len--) {
			if(params[len].indexOf(':') === 0) {
				params.splice(len, 1);
				params_number += 1;
			}
		}

		if(params_number) {
			while(params_number--) {
				named_params_str += '/[a-zA-Z0-9]+'
			}
		}

		uri = new RegExp('^' + params.join('\/') + named_params_str + '$')
		console.log(uri);
		Handlers.push({
			callback: callback,
			regexp: uri
		});
	}

	return new Sandbox(name, modules, that, callback);
}