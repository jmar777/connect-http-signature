# Connect HTTP Signature

connect-http-signature is a [Connect](https://github.com/senchalabs/connect) middleware wrapper for
Joyent's [HTTP Signature reference implementation](https://github.com/joyent/node-http-signature).

The connect-http-signature module exports two middleware components: `verify` and `gateway`. These
components separate the logic of _verifying a request's signature_, and the decision of _accepting or
rejecting a request_ based on that verification. This separation provides a simple but flexible
solution to enforcing request authentication.

## Installation

    $ npm install connect-http-signature

## Usage (demonstrated with Express)

Note: an example Express application using connect-http-signature can be found in `./example` (all the
relevant stuff is in `./example/app.js`).

As was mentioned above, connect-http-signature exports two modules; one for signature verification,
and another for securing endpoints.  Both of these modules are intended to be flexible enough to
meet the needs of a range of authentication requirements.

### connectHttpSignature.verify()

The `verify` middleware component simply verifies whether or not the request has a valid HTTP Signature.
The request object is decorated with a `signature` property, that can be inspected by middleware components
later on for authorization decisions.  The `verify` middleware component only has one required option: `pub`.
This property specificies the public key to use for request verification. Any additional options will be passed
to node-http-signature's `parseRequest` method.

Basic usage:

    var fs = require('fs'),
        httpSignature = require('connect-http-signature');

    // example express configuration block
    app.configure(function(){
        ...
        app.use(httpSignature.verify({
            pub: fs.readFileSync(__dirname + '/rsa_public.pem', 'ascii')
        }));
        ...
    });

The above example is useful when only one public key is required for all requests. This is not always the
case, however. For situations in which the public key needs to be identified on a request-by-request basis,
a function may be provided to `verify` which will then be invoked on each request. This function is then
responsible for providing options relevant to the current request.

    var fs = require('fs'),
        httpSignature = require('connect-http-signature');

    // example express configuration block
    app.configure(function(){
        ...
        app.use(httpSignature.verify(function(req, res, cb) {
            // this is an example - validate user provided values in your apps!
            var certPath = __dirname + '/certs/' + req.query.tenant + '.pem';

            fs.readFile(certPath, 'ascii', function(err, data) {
               if (err) return cb(err);
               cb(null, { pub: data });
            });
        }));
        ...
    });

### connectHttpSignature.gateway()

Once a request's signature has been verified, it's typical to then enforce that some or all endpoints are
authorized against a successful signature verification. The `gateway` middleware component can be used to
do just that.

Basic usage:

    var httpSignature = require('connect-http-signature'),
        gateway = httpSignature.gateway();
    
    app.get('/secured-endpoint', gateway, function(req, res, next) {
       res.json({ data: 'WAHOO' });
    });

This default usage simply responds with a 401 status code, and a relevant reason phrase. If your application
requires a particular response format, or you would simply like more control over how this situation is
handled, a `reject` handler may be provided that defines this custom behavior.  The `reject` handler is
defined like any other connect middleware. The typical behavior is to simply respond with an error message,
but it is also possible to call `next` if you choose _not_ to reject the request.

    var httpSignature = require('connect-http-signature'),
        gateway = httpSignature.gateway({
            reject: function(req, res, next) {
                res.json({ message: 'YOU FAIL!' }, 401);
            }
        });
    
    app.get('/secured-endpoint', gateway, function(req, res, next) {
       res.json({ data: 'WAHOO' });
    });

## Todo:

  * Beef up the test suite
  * Provide a way to distinguish between a failed authentication attempt, and simply no attempt at all
 

## License 

The MIT License (MIT)

Copyright (c) 2012 Jeremy Martin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
