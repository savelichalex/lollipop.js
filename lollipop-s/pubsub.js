/* jshint node: true */
module.exports = (function() {
'use strict';
var q = require('./promise.js');

var Pubsub = function(context) {
	var context = context || null,
		that = Object.create(Pubsub.prototype);

	that.subscribers = {
		any: []
	};
	that.context = context;

	return that;
};

Pubsub.prototype = {
	subscribe: function(type) {
		var type = type || 'any',
			defer = q.deferred(this.context);
		if(typeof this.subscribers[type] === 'undefined') {
			this.subscribers[type] = [];
		}
		this.subscribers[type].push(defer);
		return defer.promise;
	},

	unsubscribe: function(id) {
		var i, len, prop,
			subscribers = this.subscribers;
		for(i in subscribers) {
			if(subscribers.hasOwnProperty(i)) {
				if(i === id) {
					subscribers[i] = [];
				}
			}
		}
	},

	publish: function(publication, type) {
		if(!this.subscribers[type]) return false;

		var type = type || 'any',
			subscribers = this.subscribers[type],
			i, len = subscribers.length;
		for(i = 0; i < len; i += 1) {
			if(typeof publication === 'function') {
				subscribers[i].resolve(publication());
			} else {
				subscribers[i].resolve(publication);
			}
		}
	}
};

return Pubsub;
}());