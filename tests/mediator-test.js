var Mediator = require('../lollipop-s-0.2/mediator.js');

var assertPartial = function(asset1) {
	return function(asset2) {
		if(asset1 === asset2) {
			console.log('correct');
		} else {
			console.log('wrong');
		}
	}
};

assertMediatorMethod = assertPartial('[object Function]');
assertMediatorSubscribe = assertPartial('test');

assertMediatorMethod(Object.prototype.toString.call(Mediator.subscribe));

Mediator.subscribe('hello', function(mes) {
	assertMediatorSubscribe(mes);
});

Mediator.publish('hello', 'test');