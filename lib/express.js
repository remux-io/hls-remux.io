/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/

'use strict';

const events = require('events');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const uuid = require('uuid');
const debug = require('debug');
const http = require('http');
const https = require('https');
const url = require('url');
const cors = require('cors');

const hls_adapter = require('./redis-adapter');


var http_service = function(settings){

    var service = this;
    service.settings = settings || {};
    service.settings.host = service.settings.host || {};
    service.settings.host.address = service.settings.host.address || '127.0.0.1';
    service.settings.host.port = service.settings.host.port || 9901;
    service.settings.m3u8_store = service.settings.m3u8_store || new hls_adapter()


    // var playlist_store_api = require('./routes/playlist_store_rest_api');
    var debug_post = require('./routes/debug_post');
    var application = require('./routes/application');
    var tumblr_api = require('./routes/tumblr_api');
    var playlist = require('./routes/playlist');


    var app = express();
    var server = null;

    app.use(cors());
    app.use(logger('dev'));
    // app.set('views', './lib/views');
    // app.set('view engine', 'ejs');
    // app.use(bodyParser);
    app.use(bodyParser.urlencoded({ extended: false }));

    function rawBody(req, res, next) {
        req.setEncoding('utf8');
        req.rawBody = '';
        req.on('data', function(chunk) {
            req.rawBody += chunk;
        });
        req.on('end', function() {
            next();
        });
    }

    app.use(rawBody);
    app.use(function(req, res, next){
      //res.end('')
      next ()
    });

    app.use('/app', application(service));
    app.use('/tumblr', tumblr_api(service))
    app.use('/debug', debug_post(service))
    app.use('/playlist', playlist(service.settings.m3u8_store))

    server = http.createServer(app);

    var onError = function(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    }



    var onListening = function() {
      var addr = server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      console.log('HTTP istening on ' + addr.address + ':' + addr.port);
    }


    service.start = function(port,address){
        service.settings.host.address = service.settings.host.address || address || '127.0.0.1';
        service.settings.host.port = service.settings.host.port || port || 9901;

        app.set('port', service.settings.host.port);

        server.on('connection',function(socket){

        });

        server.listen(service.settings.host.port, service.settings.host.address);
        server.on('error', onError);
        server.on('listening', onListening);
    }


};

http_service.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = http_service;
