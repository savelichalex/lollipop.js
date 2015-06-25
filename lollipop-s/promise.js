/* jshint node: true */
/*if(!Promise)*/ module.exports = (function() {
'use strict';

var Promise, 
	_promise = {},
	setImmediate;

/**
 * Shim for setImmediate
 */
if(typeof setImmediate !== 'function') {
	setImmediate = function(fn, data) {
		process.nextTick(function() {
			fn(data);
		});
	}
}

/**
 * Promise constructor
 * mathces Promise/A+ specification
 * @constructor
 * @param {cb} Function; async func that need to resolve
 * @param {context} Object; optional context for promise
 */
Promise = function(cb, context) {
	var promise = Object.create(_promise.prototype),
	context = context || {};
		
	promise.fulfilled = [];
	promise.rejected = [];

	var resolve = function(data) {
		var self = promise;
		self.data = data;
		if(self.status === 'pending') {
			self.status = 'resolved';
			self.fulfilled.forEach(function(cb) {
				self.execute(cb, data);
			});
		} else {
			self.child_promise.resolve(data);
		}
	},
	reject = function(error) {
		var self = promise;
		self.error = error;
		if(self.status === 'pending') {
			self.status = 'rejected';
			self.rejected.forEach(function(cb) {
				self.execute(cb, error);
			});
		} else {
			self.child_promise.reject(error);
		}
	};

	cb.call(context, resolve, reject);

	return promise;
};

_promise.prototype = {
	fulfilled: null,
	rejected: null,
	child_promise: null,
	status: 'pending',
	error: null,
	data: null,
	then: function(fulfill, reject) {
		var promise = Object.create(_promise.prototype);
		
		promise.fulfilled = [];
		promise.rejected = [];
		promise.str = fulfill.toString();

		this.child_promise = promise;
		this.fulfilled.push(fulfill);
		if (reject) this.rejected.push(reject);

		if(this.status === 'resolved') {
			this.execute(fulfill, this.data);
		} else if(this.status === 'rejected') {
			this.execute(reject, this.error);
		}

		return promise;
	},
	execute: function(cb, data) {
		var self = this;
		setImmediate(function() {
			if(Object.prototype.toString.call(data) !== '[object Array]') {
				var tempArray = [];
				tempArray.push(data);
				data = tempArray;
			}
			var res = cb.apply({}, data);
			if(res !== undefined && res.toString() === '[object Promise]') {
				res.then(function() {
					var args = Array.prototype.slice.call(arguments);
					self.child_promise.resolve(args);
				}, function(err) {
					self.child_promise.reject(err);
				});
			} else {
				self.child_promise.resolve(res);
			}
		}, data);

		return this.child_promise;
	},
	resolve: function(data) {
		var self = this;
		this.data = data;
		if(this.status === 'pending') {
			this.status = 'resolved';
			this.fulfilled.forEach(function(cb) {
				self.execute(cb, data);
			});
		} else {
			return;
		}		
	},
	reject: function(error) {
		var self = this;
		this.error = error;
		if(this.status === 'pending') {
			this.status = 'rejected';
			this.rejected.forEach(function(cb) {
				self.execute(cb, data);
			});
		} else {
			return;
		}
	},
	toString: function() {
		return '[object Promise]';
	}
};

return Promise;
}());