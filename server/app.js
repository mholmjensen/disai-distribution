/// <reference path="typings/node/node.d.ts"/>

var path = require('path');

var swaggerExpress = require('swagger-express-mw');
var express = require('express');
var redirect = require('express-redirect');
var cors = require('cors');
var extend = require('extend');

var favicon = require('serve-favicon');
var logger = require('morgan');

var security = require('./api/helpers/security.js');
var applicability = require('./api/helpers/applicability.js');

// var api = require('./routes/api');

var app = express();
redirect(app);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(cors());

// Routes
app.redirect('/', '/viewer');
app.use('/viewer', express.static(path.join(__dirname, '../viewer/build')));
app.use('/fonts', express.static(path.join(__dirname, '../viewer/build/fonts')));

var config = {
  appRoot: __dirname, // required config
  swagger_host: 'localhost:3000' // Overwritten if set in config.js
};
try {
  var local_config = require("./config.js");
  extend( config, local_config );
} catch (e) {
  // Ignore
}

swaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  swaggerExpress.runner.config.swagger.securityHandlers = {
    agentToken: function (req, authOrSecDef, scopesOrApiKey, next) {
      var authResult = security.authAgentToken( req, scopesOrApiKey );
      if ( typeof authResult === 'object' ) {
        // Error
        next( authResult );
      } else {
        next();
      }
    }
  };

  // Enable SwaggerUI
  app.use(swaggerExpress.runner.swaggerTools.swaggerUi({
    swaggerUi: '/docs',
    swaggerUiDir: path.join(__dirname, 'swagger-ui')
  }));

  app.use(swaggerExpress.swaggerDoc());

  // install middleware
  // swaggerExpress.register(app);

  app.use(swaggerExpress.metadata());
  app.use(swaggerExpress.security());
  app.use(swaggerExpress.validator());
  app.use(swaggerExpress.expressCompatibilityMW());
  app.use(applicability.middleware());
  app.use(swaggerExpress.router());


  // Custom error handler that returns JSON
  app.use(function(err, req, res, next) {
    console.warn('Error handler intercepted: ', err.stack);
    if (typeof err !== 'object') {
      // If the object is not an Error, create a representation that appears to be
      err = {
        message: String(err) // Coerce to string
      };
    } else {
      // Ensure that err.message is enumerable (It is not by default)
      Object.defineProperty(err, 'message', { enumerable: true });
    }

    // Return a JSON representation of #/definitions/ErrorResponse
    res.json(err);
  });

  var port = process.env.PORT || 3000;
  app.listen(port);
});

module.exports = app;
