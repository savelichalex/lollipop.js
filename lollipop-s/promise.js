/* jshint node: true */
module.exports = (function() {
'use strict';
var Deferred, Promise,
	Promisify,
	setImmediate;

//shim
if(typeof setImmediate !== 'function') {
	setImmediate = function(fn, data) {
		process.nextTick(function() {
			fn(data);
		});
	}
}

Promise = function(context) {
	var promise = Object.create(Promise.prototype);

	promise.fulfilled = [];
	promise.rejected = [];
	promise.context = context;

	return promise;
};

Promise.prototype = {
	fulfilled: null,
	rejected: null,
	status: 'pending',
	error: null,
	context: null,
	then: function(fulfill, reject) {
		var defer = new Deferred();
		this.fulfilled.push({
			fn: fulfill,
			defer: defer
		});
		if(reject) {
			this.rejected.push({
				fn: reject,
				defer: defer
			});
		}

		if(this.status === 'resolved') {
			this.execute({
				fn: fulfill,
				defer: defer
			}, this.data);
		} else if(this.status === 'rejected') {
			this.execute({
				fn: reject,
				defer: defer
			}, this.error);
		}

		return defer.promise;
	},
	execute: function(obj, result) {
		var that = this;
		setImmediate(function() {
			if(Object.prototype.toString.call(result) !== "[object Array]") {
				var tempArray = [];
				tempArray.push(result)
				result = tempArray;
			}
			var res = obj.fn.apply(that.context, result);
			if(res instanceof Promise) {
				obj.defer.bind(res);
			} else {
				if(obj.defer) {
					obj.defer.resolve(res);
				}
			}
		}, result);
	},
	deferred: function(callback) {
		this.fulfilled.push({
			fn: callback,
			defer: void 0
		});
	},
	toString: function() {
		return '[object Promise]';
	}
};

Deferred = function(context) {
	var defer = Object.create(Deferred.prototype);

	defer.promise = new Promise(context);
	defer.promise.context = context || null;

	return defer;
};

Deferred.prototype = {
	promise: null,
	resolve: function(data) {
		var promise = this.promise;
		promise.data = data;
		promise.status = 'resolved';
		promise.fulfilled.forEach(function(cb) {
			promise.execute(cb, data);
		});
	},
	reject: function(error) {
		var promise = this.promise;
		promise.error = error;
		promise.status = 'rejected';
		promise.rejected.forEach(function(cb) {
			promise.execute(cb, error);
		});
	},
	bind: function(promise) {
		var self = this;
		promise.then(function(res) {
			self.resolve(res);
		}, function(err) {
			self.reject(err);
		});
	}
};

Promisify = function(asyncFn, context) {
	return function() {
		var defer = new Deferred(),
			args = Array.prototype.slice.call(arguments);

		args.push(function(err, val) {
			if(err) {
				defer.reject(err);
			}

			defer.resolve(val);
		});

		asyncFn.apply((context || {}), args);

		return defer.promise;
	}
};

return {
	deferred: Deferred,
	promisify: Promisify,
	promise: Promise
};
}());