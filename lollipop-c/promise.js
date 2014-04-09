var Deferred, Promise,
	Promisify,
	promise, defer,
	setImmediate;

//shim
if(typeof setImmediate !== "function") {
	setImmediate = function(fn, data) {
		setTimeout(function() {
			fn(data);
		}, 0);
	}
}

Promise = function() {
	var promise = Object.create(Promise.prototype);

	promise.fulfilled = [];
	promise.rejected = [];

	return promise;
};

Promise.prototype = {
	fulfilled: null,
	rejected: null,
	status: 'pending',
	error: null,
	then: function(fulfill, reject) {
		var defer = Deferred();
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
			this.executeCb({
				fn: fulfilled,
				defer: defer
			}, this.data);
		} else if(this.status === 'rejected') {
			this.executeCb({
				fn: reject,
				defer: defer
			}, this.error);
		}

		return defer.promise;
	},
	executeCb: function(obj, result) {
		setImmediate(function() {
			var res = obj.fn(result);
			if(res instanceof Promise) {
				obj.defer.bind(res);
			} else {
				obj.defer.resolve(res);
			}
		}, result);
	},
	toString: function() {
		return '[object Promise]';
	}
};

Deferred = function() {
	var defer = Object.create(Deferred.prototype);

	defer.promise = Promise();

	return defer;
};

Deferred.prototype = {
	promise: null,
	resolve: function(data) {
		var promise = this.promise;
		promise.data = data;
		promise.status = 'resolved';
		promise.fulfilled.forEach(function(cb) {
			promise.executeCb(cb, data);
		});
	},
	reject: function(error) {
		var promise = this.promise;
		promise.error = error;
		promise.status = 'rejected';
		promise.rejected.forEach(function(cb) {
			promise.executeCb(cb, error);
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
		var defer = Deferred(),
			args = Array.prototype.slice.call(arguments);

		args.push(function(err, val) {
			if(err) {
				defer.reject(err);
			}

			defer.resolve(val);
		});

		return defer.promise;
	}
};