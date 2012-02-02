
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	httpSignature = require('connect-http-signature');

var app = module.exports = express.createServer(),
	gateway = httpSignature.gateway();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	// attempt to verify signatures on all incoming requests
	app.use(httpSignature.verify({
		pub: require('fs').readFileSync(__dirname + '/rsa_public.pem')
	}));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// Routes

// default landing page is left unsecured
app.get('/', routes.index);

// API endpoint is secured through the gateway middleware component
app.get('/api', gateway, function(req, res, next) {
	res.json({ data: 'WAHOO' });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
