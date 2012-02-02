// @todo: this file needs a LOT more tests...

var assert = require('assert'),
	fs = require('fs'),
	connect = require('connect'),
	httpSignature = require('../node_modules/http-signature'),
	connectHttpSignature = require('../'),
	app;

describe('connectHttpSignature.verify()', function() {

	before(function() {
		app = connect();
	});

	describe('middleware configuration', function() {
		it('should accept an Object for configuration', function() {
			app.use('/object-config', connectHttpSignature.verify({
				pub: fs.readFileSync(__dirname + '/rsa_public.pem')
			}));
		});

		it('should accept a Function for configuration', function() {
			app.use('/function-config', connectHttpSignature.verify(function(req, res, cb) {
				fs.readFile(__dirname + '/rsa_public.pem', function(err, data) {
					cb(err, { pub: data });
				});
			}));
		});
	});

});
