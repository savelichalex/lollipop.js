/* jshint node: true */
module.exports = (function() {
'use strict';

var Pubsub = function() {
	var subscribers = {
		any: []
	}

	//Subscribers getters and setters
	this.getSubscribers = function(type) {
		return subscribers[type];
	}

	this.setClearSubscribersType = function(type) {
		subscribers[type] = [];
	}

	this.addToSubscribers = function(type, data) {
		subscribers[type].push(data);
	}

	this.subscriberActiveIterator = function(cb) {
		for(i in subscribers) {
			if(subscribers.hasOwnProperty(i)) {
				cb.apply(this, i);
			}
		}
	}
};

Pubsub.prototype = {
	constructor: Pubsub,
	subscribe: function(type, cb) {
		var type = type || 'any';
		if(typeof this.getSubscribers(type) === 'undefined') {
			this.setClearSubscribersType(type);
		}
		this.addToSubscribers(type, cb);
		
	},

	unsubscribe: function(id) {
		var i, len, prop,
			subscribers = this.subscribers;
		this.subscriberActiveIterator(function(i) {
			if(i === id)
				this.setClearSubscribersType(i);
		}); //TODO test it
	},

	publish: function(type, publication) {
		if(!this.getSubscribers(type)) return false;

		var type = type || 'any',
			subscribers = this.getSubscribers(type),
			i, len = subscribers.length;
		if(Object.prototype.toString.call(publication) !== '[object Array]') {
				var tempArray = [];
				tempArray.push(publication);
				publication = tempArray;
			}
		for(i = 0; i < len; i += 1) {
			subscribers[i].apply({}, publication);
		}
	}
};

return Pubsub;
}());