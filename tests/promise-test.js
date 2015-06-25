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

var asset = assetPartial('test');
var pubasset2 = assetPartial('test2');

var p = new Promise(function(resolve, reject) {
	setInterval(function() { resolve('test'); }, 1000);
});

p.then(function(m) {asset(m);});