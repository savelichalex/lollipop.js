module.exports = (function(mediator) {
var Server, 
	onGet, onPost, onPut, onDelete,
	noHandler,
	PORT = +process.env.PORT || 1337,
	http = require('http'),
	url = require('url'),
	fs = require('fs');

/* REST API functions */
onGet = function(req, res, route, params) {
	mediator.callAction(route.controller, route.action, params, res);
};

onPost = function(req, res, route, params) {
	mediator.callAction(route.controller, route.action, params, res);
};

onPut = function(req, res) {
	//TODO: put
};

onDelete = function(req, res) {
	//TODO: delete
};

//check is pathname this is static file, if not then return 404 error
noHandler = function(res, pathname) {
	var tmp = pathname.lastIndexOf('.'),
		extension = pathname.substring(tmp + 1),
		mimes = {
			"css": "text/css",
			"js": "text/javascript",
			"html": "text/html",
			"png": "image/png",
			"jpg": "image/jpeg",
			"jpeg": "image/jpeg",
			"eot": "application/vnd.ms-fontobject",
			"ttf": "application/octet-stream",
			"woff": "application/octet-stream",
			"svg": "image/svg+xml"
		},
		file_path, key, file_path;
		for(key in mimes) {
		if(mimes.hasOwnProperty(key)) {
			if(key === extension) {
				file_path = "." + pathname;
			}
		}
	}
	if(file_path) {
		fs.readFile(file_path, function(err, data) {
			if (err) {
				res.writeHead(500, {"Content-type": "text/plain"});
				res.end("500: Internal Server Error");
			}
			res.writeHead(200, {"Content-type": mimes[extension]});
			res.end(data);
		});
	} else {
		fs.readFile('public/404.html', function(err, data) { //TODO: change hardcoded 404 template(must be on config)
			res.writeHead(404);
			res.end(data);
		});
	}
};


Server = function(routes) {
	http.createServer(function(req, res) {
		var pathname = url.parse(req.url).pathname,
			i, 
			match = false, //need to check route match
			params = [], handle,
			postData = "", fileName,
			http_method;
		
		for(i in routes) {
			if(routes.hasOwnProperty(i)) {
				if(routes[i].regexp.test(pathname) || pathname === i) {
					match = true;
					params = pathname.match(routes[i].regexp).splice(1); //new named parameters
					
					http_method = req.method;
					if(http_method === 'GET') {
						onGet(req, res, routes[i], params);
					} else if(http_method === 'POST') {
						onPost(req, res, routes[i], params);
					} else if(http_method === 'PUT') {
						onPut(req, res);
					} else if(http_method === 'DELETE') {
						onDelete(req, res);
					}

					if(req.method === 'POST') {
						if(req.headers['content-type']) {
							fileName = new Date().getTime() + '.' + req.headers['content-type'].split('/')[1];
							var file = fs.createWriteStream('app/static/images/'+fileName);
							req.pipe(file);
							params.push(fileName);
						} else {
							req.onend = function(data) { console.log(data); }; //save form data
						}
					}
					
				}
			}
		}
		if(!match) {
			noHandler(res, pathname);
		}
	}).listen(PORT);
};

return Server;

});