
# Connect HTTP Signature

connect-http-signature is a [Connect](https://github.com/senchalabs/connect) middleware wrapper for
Joyent's [HTTP Signature reference implementation](https://github.com/joyent/node-http-signature).

The connect-http-signature module exports two middleware components: `verify` and `gateway`. These
components separate the logic of _verifying a request's signature_, and the decision of _accepting or
rejecting a request_ based on that verification. This separation provides for a simple but flexible
solution to encorcing request authentication.

## Installation

    $ npm install connect-http-signature

## Example (Express)

The following code shows `app.js` from a default Express application (the result of running the 
`express` scaffolding utility), with the bare minimum additions required to secure an /api
endpoint.

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

## Todo:

  * Update README to show request-specific verification configurations and custom reject handlers
  * Beef up the test suite
 

## License 

The MIT License (MIT)

Copyright (c) 2012 Jeremy Martin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
