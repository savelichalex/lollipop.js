var Pubsub = require('../lollipop-s-0.2/pubsub.js'),
	Promise = require('../lollipop-s-0.2/promise.js'),
	pubsub = new Pubsub();

var assetPartial = function(asset1) {
	return function(asset2) {
		if(asset1 === asset2) {
			console.log('correct');
		} else {
			console.log('wrong');
		}
	}
};

var pubasset = assetPartial('test');
var pubsubWithPromiseAsset = assetPartial('test2');

pubsub.subscribe('hello', function(mes) {
	pubasset(mes);
});

pubsub.subscribe('hello2', function(mes) {
	new Promise(function(resolve) {
		resolve(mes);
	}).then(function(data) {
		pubsubWithPromiseAsset(data);
	})
})

pubsub.publish('hello', 'test');

pubsub.publish('hello2', 'test2');

var Manadger = function() {
	return {
		i: 0,
		call: function(model, method, cb) {
			this.i++;
			pubsub.subscribe(model+':'+method+':'+this.i, cb);
			pubsub.publish(model+':'+method, this.i);
		}
	};
};

var Model = function() {
	this.test = function(i) {
		setTimeout(function() {pubsub.publish('model:test:'+i, 'this work + ' + i);}, 1000);			
	};

	pubsub.subscribe('model:test', this.test);
};

var man = new Manadger();

var model = new Model();

var Controller = function() {
	this.log = function(mes) {
		console.log(mes);
	};
	this.callMethod = function(model, method) {
		man.call(model, method, this.log);
	};	
};

var con1 = new Controller(),
	con2 = new Controller();

con1.callMethod('model', 'test');
con2.callMethod('model', 'test');