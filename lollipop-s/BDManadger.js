var Lollipop = require('./lollipop.js');

Lollipop.Module('BDManadger', function() {
	var allowableNumbers = [],
		MAX = 1000,
		MIN = 0,
	_getRandom = function() {
		return Math.round(Math.random(MIN,MAX)*MAX);
	},
	_getAllowableNumber = function() {
		var n;
		if(allowableNumbers[n = _getRandom()] == 1) 
			_getAllowableNumber();
		else
			return n;
	},
	self = this;

	this.subscribe('callBD', function(e) {
		var id = _getAllowableNumber();
		self.subscribe(e.model+':'+e.method+':'+id, e.cb);
		self.publish(e.model+':'+e.method, [id, e.data, e.res]);
		//self.unsubscribe
	});
});