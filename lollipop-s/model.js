/* jshint node: true */
module.exports = function(Sandbox, q) {
'use strict';
return function Model(name, callback) {
	if(!(this instanceof Model)) {
		return new Model(name, callback);
	}

	var that = {},
		mongo, db,
		collection,
		connection,
		MongoClient = require('mongodb').MongoClient,
		Server = require('mongodb').Server;
	that.setMethod = function(methodId) {
		var type = name + ':' + methodId,
			start = type + '_start',
			stop = type + '_stop',
			self = this,
			defer = q.deferred();
		
		this.subscribe(start)
			.then(function() {
				var args = Array.prototype.slice.call(arguments);
				defer.resolve(args[0]);
			});

		q.promise.prototype.end = function() {
			this.then(function(res) {
				if(connection) {
					connection.close();
					connection = void 0;
				}
				self.publish(stop, res);
			}, function(err) {
				if(connection) {
					connection.close();
					connection = void 0;
				}
				self.publish(stop, err);
			});
		};

		return defer.promise;
	};

	that.newMongoConnection = function(host, PORT) {
		var PORT = PORT || 27017;
		mongo = new MongoClient(new Server(host, PORT), {native_parser: true});
		return {
			db: function(d) {
				db = mongo.db(d);
				return this;
			},
			collection: function(col) {
				collection = db.collection(col);
				return this;
			},
		};
	};

	/*
		if(!mongo) return new Error("Mongo don't connect to server");
		if(!db) return new Error("Db don't found");
		if(!collection) return new Error("Collection don't found"); */
	//TODO: mongo errors while connect
	q.promise.prototype.mongoConnect = function() {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments);
			mongo.open(function(err, connect) {
				connection = connect;
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(args);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.findOne = function(query) {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments);
			if(typeof query === "function") {
				var _query = query.apply(null, args); //TODO: need context
			} 
			collection.findOne(_query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.find = function(query) {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments);
			if(typeof query === "function") {
				var _query = query.apply(null, args); //TODO: need context
			} 
			collection.find(_query, function(err, cursor) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(cursor);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.update = function(desired, replaceble, options) {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments),
				_query,
				_desired, _replaceble,
				_options = options || {};
			if(typeof desired === "function") {
				_query = desired.apply(null, args); //TODO: need context
				_desired = _query[0];
				_replaceble = _query[1];
				_options = _query[2] || {};
			}
			collection.update(_desired, _replaceble, _options, function(err, data, updated) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve([data, updated]);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.insert = function(query) {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments);
			if(typeof query === "function") {
				var _query = query.apply(null, args); //TODO: need context
			} 
			collection.insert(_query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.remove = function(query) {
		var defer = q.deferred(),
		callback = function() {
			var args = Array.prototype.slice.call(arguments);
			if(typeof query === "function") {
				var _query = query.apply(null, args); //TODO: need context
			}
			collection.remove(_query, function(err, data) {
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(data);
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	Sandbox(that, callback);
};
};