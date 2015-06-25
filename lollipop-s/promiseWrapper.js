/* jshint node: true */
module.exports = (function() {
'use strict';

var PromiseWrapper;

/**
 * PromiseWrapper constructor
 * this is decorator for promise that add new methods
 * and provide cascade style
 * @param {promise} Promise; parent promise
 */
PromiseWrapper = function() {
	var queue = [];
	this.enqueue = function(cb) {
		queue.push(cb);
	}
	this.getQueue = function() {
		return queue;
	}
};

PromiseWrapper.prototype = {
	then: function(resolve, reject) {
		this.enqueue(resolve);
		if(reject !== void 0)
			this.enqueue(reject);
		else
			this.enqueue(function(e) { return e });
		return this;
	},
	accept: function(promise) {
		var p = promise, i,
		queue = this.getQueue(),
		length = queue.length;
		for(i = 0; i < length; i = i + 2) 
			p = p.then(queue[i], queue[i + 1]);
		return p;
	},
	log: function(str) {
		return this.then(function(mes) {
			console.trace(mes);
			return mes;
		});
	}
}

return PromiseWrapper;
}());