var Lollipop = Lollipop || {};

Lollipop.version = 0.1;
Lollipop.name = "Lollipop";

Lollipop.Mediator = (function() {
	'use strict';
	var subscribers,
		subscribe,
		unsubscribe,
		publish;

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
		subscribers: subscribers, //del in prod
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		publish: publish,
	}
}());