/* jshint node: true */
module.exports = function(Sandbox) {
return function Module(callback) {
	if(!(this instanceof Module)) {
		return new Module(callback);
	}

	var that = {};

	Sandbox(that, callback);
};
};