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
				defer.resolve();
			});

		q.promise.prototype.end = function() {
			this.then(function(res) {
				if(connection) {
					connection.close();
					connection = void 0;
				}
				self.publish(stop, res);
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

	q.promise.prototype.mongoConnect = function() {
		var defer = q.deferred(),
		callback = function() {
			mongo.open(function(err, connect) {
				connection = connect;
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve();
				}
			});
		};
		this.deferred(callback);
		return defer.promise;
	};

	q.promise.prototype.findOne = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.findOne(query, function(err, data) {
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
			collection.find(query, function(err, data) {
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

	q.promise.prototype.update = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.update(query, function(err, data) {
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

	q.promise.prototype.insert = function(query) {
		var defer = q.deferred(),
		callback = function() {
			collection.insert(query, function(err, data) {
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