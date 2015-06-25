var Promise = require('../lollipop-s-0.2/promise.js'),
	PromiseWrapper = require('../lollipop-s-0.2/promiseWrapper.js');

var assetPartial = function(asset1) {
	return function(asset2) {
		if(asset1 === asset2) {
			console.log('correct');
		} else {
			console.log('wrong');
		}
	}
};

PromiseWrapper.prototype.asset = function(data) {
	var asset = assetPartial(data);
	return this.then(function(d) {
		asset(d);
	});
};

var TestObject = function() {
	var wrapper = new PromiseWrapper();

	wrapper.start = function() {
		wrapper.accept(new Promise(function(resolve) {
			resolve('it');
		}));
	}

	return wrapper;
}

var test = new TestObject()
				.then(function(data) {
					return data + ' work!';
				})
				.asset('it work!')
				.start();