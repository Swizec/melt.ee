//-------------------------------------------------------//
// Dependencies
//-------------------------------------------------------//
var express = require('express');
//var http = require('http');
var lessMiddleware = require('less-middleware');
var path = require('path');
var _ = require('underscore')._;
var step = require('step');
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'meltee');
var fs = require('fs');
var io;

//-------------------------------------------------------//
// Route dependencies
//-------------------------------------------------------//
var route_auth = require('./routes/auth');
var route_topics = require('./routes/topics');
var route_API = require('./routes/API');
var route_mobile = require('./routes/mobile');
var route_admin = require('./routes/admin');

//-------------------------------------------------------//
// Load settings
//-------------------------------------------------------//
var settings = fs.existsSync('./settings.js')?require('./settings'):require('./def_settings.js');

//-------------------------------------------------------//
// Globals
//-------------------------------------------------------//
global._ = _;
global.step = step;
global.db = db;
global.mongoose = mongoose;
global.settings = settings;

var models = require('./models');
global.models = models;
//---------------------------------------------------------------//
// Expressjs
//---------------------------------------------------------------//
var app = express();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "whatnot1347" }));
  app.use(lessMiddleware({src: __dirname+'/public', compress: true}));
  app.use(express['static'](path.join(__dirname, 'public')));
  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/views');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//---------------------------------------------------------------//
// Frontend routes (mobile mostly)
//---------------------------------------------------------------//
app.get('/', route_mobile.index);
app.get('/login', route_auth.login);
app.get('/auth', route_auth.auth);
app.get('/access_token', route_auth.access_token);
app.get('/logout', route_auth.logout);

app.get('/topics.js', route_topics.get_topics);
app.post('/save_topics', route_topics.save_topics);

//---------------------------------------------------------------//
// Backend routes (admin CRUD)
//---------------------------------------------------------------//
app.get('/admin', route_admin);

var route_API = require('./routes/API');
//---------------------------------------------------------------//
// API (crud)
//---------------------------------------------------------------//
app.post('/api/:collection', route_API.create);
app.get('/api/:collection', route_API.read);
app.put('/api/:collection/:id', route_API.update);
app['delete']('/api/:collection/:id', route_API.remove);

//------------------------------------------------------------------//
// Create server
//------------------------------------------------------------------//
var server = app.listen(settings.port);
var io = require('socket.io').listen(server);
console.log("Express server listening on port " + settings.port);