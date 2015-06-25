/* jshint node: true */
module.exports = function(Sandbox, q) {
'use strict';
var utils = require('./utils.js'),
	PromiseWrapper = require('./promiseWrapper.js'),
	Promise = require('./promise.js'),
	fs = require('fs');

function Model(name, callback) {
	if(!(this instanceof Model)) {
		return new Model(name, callback);
	}

	var that = {},
		Promise = require('./promise.js'),
		PromiseWrapper = require('./promiseWrapper.js');
		/*mongo, db,
		collection,
		connection,
		MongoClient = require('mongodb').MongoClient,
		Server = require('mongodb').Server;*/
	this.setMethod = function(methodId) {
		var type = name + ':' + methodId,
			self = this,
			wrapper = new PromiseWrapper();

		this.subscribe(type, function(id, data, res) {
			wrapper.accept(new Promise(function(resolve) {
				resolve(data);
			})).then(function(data) {
				self.publish(type + ':' + id, data);
			});
		});

	/*	PromiseWrapper.prototype.end = function() {
			this.promise.then(function(res) {
				/*if(connection) {
					connection.close();
					connection = void 0;
				}*
				self.publish(stop, res);
			}, function(err) {
				/*if(connection) {
					connection.close();
					connection = void 0;
				}*
				self.publish(stop, err);
			});
		};

		return new PromiseWrapper(
			this.subscribe(start)
			.then(function() {
				var args = Array.prototype.slice.call(arguments);
				return args[0];
			}));*/



		return wrapper;
	};

	

	/*that.newMongoConnection = function(host, PORT) {
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
	/*q.promise.prototype.mongoConnect = function() {
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
	};*/

	that.ARFactory = function(name, params) {
		var tableRow = {},
			_rowParams = {},
			insert = false;
		tableRow.prototype.save = function() {
			var query_str = '',
				params_arr = [],
				vals_arr = [];

			params.forEach(function(val) {
				params_arr.push(val);
				vals_arr.push(_rowParams[val]);
			});
			
			if(!insert) {
				query_str += 'INSERT INTO ' + name + ' ',
				if(params_arr.length === 0) {
					query_str += 'DEFAULT VALUES';
				} else {
					query_str += '(' params_arr.join(',') + ') WHERE VALUES (' + vals_arr.join(',') + ')';
				}
			} else {
				query_str += 'UPDATE ' + name + ' SET ';
			}
		}

		var isInParams = function(p) {
			params.forEach(function(param) {
				if(param === p) return true;
			});
			return false;
		}

		return {
			new: function(vals) {
				var row = Object.create(tableRow.prototype);
				for(var i in vals) {
					if(vals.hasOwnProperty(i) && isInParams(i)) {
						_rowParams[i] = vals[i];
					}
				}
				return row;
			},
			set: function(p, val) {
				if(isInParams(p)) {
					_rowParams[p] = val;
				} else {
					throw new Error("Table does not have this column");
				}
			},
			get: function(p) {
				if(isInParams(p)) {
					return _rowParams[p];
				} else {
					throw new Error("Table does not have this column");
				}
			},
			find: function(condition) {
				if(Object.prototype.toString.call(condition) !== '[object Object]') {
					throw new Error("condition must be an Object");
				}
				//TODO find syntax
			}
		}
	}

	this.callSuper(callback);
};

Model.extends(Sandbox);

return Model;
};