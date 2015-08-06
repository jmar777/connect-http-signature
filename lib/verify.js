var httpSignature = require('http-signature'),
	regSignatureError = /^(?:HttpSignature|ExpiredRequest|InvalidHeader|InvalidParams|MissingHeader)Error$/;

/**
 * Decorates the provided request object with a `signature` property indicating
 * the status of an HTTP Signature authentication attempt.
 * @param {ServerRequest} req The ServerRequest provided to this middleware
 * @param {Object} opts The options provided to this middleware. `pub` property
 *   is required, the remainder of the properties are passed to 
 *   `httpSignature.parseRequest()`
 * @param {Function} cb An error-first callback to invoke upon completion
 */
function verifySignature(req, opts, cb) {
	// default signature decorator
	// @todo: add some sort of a reason/status property that indicates whether or not
	// the request attempted to authenticate but was malformed (i.e., HTTP 400), or if
	// it simply didn't attempt to authenticate at all (i.e., HTTP 401)
	var signature = req.signature = { verified: false };

	// validate options
	if (!opts.hasOwnProperty('pub')) return cb(Error('pub option must be specified'));
	// if just a single key was provided, turn it into an Array for consistent handling below
	var keys = Array.isArray(opts.pub) ? opts.pub : [opts.pub];

	try {
		// parse the request
		var parsed = httpSignature.parseRequest(req, opts);

		//Use different verification methods depending if the algorithm is HMAC or not
		var isHmac =  parsed.algorithm && parsed.algorithm.toLowerCase().indexOf('hmac') === 0;
		verifyFunc = (isHmac) ?  httpSignature.verifyHMAC : httpSignature.verifySignature;
		// test the signature against the provided keys
		for (var i = 0, len = keys.length, key; i < len; i++) {
			key = keys[i];
			if (verifyFunc(parsed, key)) {
				signature.verified = true;
				break;
			}
		}
	} catch(e) {
		// check to see if the problem was with the request, or a program error
		if (regSignatureError.test(e.name)) {
			// problem with the request, so `signature.verified` already defaulted to false
			return cb();
		} else {
			// program error (usually bad input to `parseRequest()`)
			return cb(e);
		}
	}
	return cb();
}

/**
 * Exports a Connect middleware wrapper around Joyent's HTTP Signature reference implementation
 * (with a few considerations for easy configuration...).
 * @param {Object|Function} opts Options for this middleware.  When opts is an Object, it is given
 *   directly as the options.  When opts is a Function, it is invoked on each request and expected
 *   to resolve to an options Object that is relevant to that request.  It will be passed the
 *   following parameters: ServerRequest, ServerResponse, and Function(err, opts). The only required
 *   property for options is `pub`, the public key to use for verification. All other properties are
 *   passed through to `httpSignature.parseRequest()`.
 */
module.exports = function(opts) {
	// make sure opts is set
	opts || (opts = {});
	return function connectHTTPSignature(req, res, next) {

		// opts may be a function, which will asynchronously resolve to the options we need
		// on a request-by-request basis
		if (typeof opts === 'function') {
			opts(req, res, function(err, opts) {
				if (err) return next(err);
				verifySignature(req, opts, next);
			});
		} else {
			// opts is already the options object
			verifySignature(req, opts, next);
		}

	};
};