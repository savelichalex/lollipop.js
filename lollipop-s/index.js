#!/usr/bin/env node
var fs = require('fs'),
	version = '0.0.1',
	index,
	source = process.argv.splice(2, 1)[0],
	app_name = process.argv.splice(2, 1)[0];

index = {
	version: function() {
		console.log(version);
	},
	newApp: function() {
		try {
			fs.mkdirSync('app');
			fs.mkdirSync('app/views');
			fs.mkdirSync('app/controllers');
			fs.mkdirSync('app/models');
			fs.mkdirSync('app/static');
			fs.mkdirSync('app/static/js');
			fs.mkdirSync('app/static/styles');
			fs.mkdirSync('app/static/images');
			fs.mkdirSync('vendor');
			fs.mkdirSync('vendor/js');
			fs.mkdirSync('vendor/styles');
			fs.mkdirSync('public');
			fs.mkdirSync('config');
			fs.mkdirSync('test');

			var package_text = "{\n\t\"name\": \"" + app_name + "\"\n}";
			var package_file = fs.openSync('package.json', 'w');
			fs.writeSync(package_file, package_text);

			var conf_text = "{\n\t\"name\": \"" + app_name + "\"\n}";
			var conf_file = fs.openSync('config/conf.json', 'w');
			fs.writeSync(conf_file, conf_text);

			var router_text = "var Lollipop = require('lollipop');\n\nLollipop.Router(function() {\n\tthis.route(\"/\", \"main#index\");\n});";
			var router_file = fs.openSync('app/router.js', 'w');
			fs.writeSync(router_file, router_text);

			var controller_text = "var Lollipop = require('lollipop');\n\nLollipop.Controller('main', function() {\n\tthis.setAction('index', function() {\n\t\tthis.render();\n\t});\n});";
			var controller_file = fs.openSync('app/controllers/main.js', 'w');
			fs.writeSync(controller_file, controller_text);

			var view_text = "<!doctype html>\n<html lang=\"en\">\n<head>\n\t<meta charset='UTF-8'>\n\t<title>" + app_name + "</title>\n</head>\n<body>\n\t<h1>This is your Lollipop app!</h1>\n</body>\n</html>";
			var view_file = fs.openSync('app/views/index.html', 'w');
			fs.writeSync(view_file, view_text);

			var index_text = "var Lollipop = require('lollipop'),\nrouter = require('./app/router.js'),\nmain = require('./app/controllers/main.js');\n\nLollipop.PATH = process.cwd();\nLollipop.Core.startAll();\n";
			var index_file = fs.openSync('index.js', 'w');
			fs.writeSync(index_file, index_text);

			console.log(app_name + " app create.");
		} catch(e) {
			console.log("Something wrong " + e);
		}		
	},
	start: function() {
			var path = process.cwd(), path_local,
				config = fs.readFileSync(path + '/config/conf.json');
			config = JSON.parse(config);

			var Lollipop = require('./lollipop.js'),
				modules = config.modules,
				modules_ = {},
				controllers = config.controllers,
				controllers_ = {},
				models = config.models,
				models_ = {},
				i;

			if(modules) {
				for(i in modules) {
					if(modules.hasOwnProperty(i)) {
						modules_[i] = require(path+'/app/modules/'+modules[i]);
					}
				}
			}
			if(controllers) {
				for(i in controllers) {
					if(controllers.hasOwnProperty(i)) {
						controllers_[i] = require(path+'/app/controllers/'+controllers[i]);
					}
				}
			}
			if(models) {
				for(i in models) {
					if(models.hasOwnProperty(i)) {
						models_[i] = require(path+'/app/models/'+models[i]);
					}
				}
			}
			router = require(path+'/app/router.js');
			
			Lollipop.PATH = path;
			Lollipop.Core.startAll();
	},
};

switch(source) {
	case '-v': index.version(); break;
	case 'new': index.newApp(); break;
	case 'start': index.start(); break;
}