/**
 * Exports a Connect "gateway" middleware component that forces requests to have been signed
 * @param {Object} opts Options for this middleware (optional). When the `reject` property
 *   is specified, it will be invoked using the same method signature for any Connect middleware
 *   (i.e., req, res, next) whenever a request is determined to have not been signed.  The default
 *   `reject` implementation simply responds with a 401 status code and a relevant reaosn phrase.
 */
module.exports = function(opts) {
	// make sure opts is set
	opts || (opts = {});

	// default the reject handler
	opts.reject || (opts.reject = function(req, res, next) {
		res.writeHead(401, 'HTTP Signature authentication required');
		res.end();
	});

	return function httpSignatureGateway(req, res, next) {
		// check our flag (see verify.js) to determine if the request has been signed,
		// and next() or reject(), as appropriate
		req.signature && req.signature.verified ? next() : opts.reject(req, res, next);
	};

};