/* jshint node: true */
module.exports = (function() {
	Object.prototype.extends = function(Parent) {
		this.prototype = Object.create(Parent.prototype);
		this.prototype.superConstructor = Parent.prototype.constructor;
		this.prototype.callSuper = function() {
			this.superConstructor.apply(this, arguments);
		};
	};
}());