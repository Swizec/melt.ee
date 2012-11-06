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
// Load settings
//-------------------------------------------------------//
var settings = require('./def_settings.js');
if(fs.existsSync('./settings.js')) {
    settings = _.extend(settings, require('./settings'));
}

//-------------------------------------------------------//
// Globals
//-------------------------------------------------------//
global._ = _;
global.step = step;
global.db = db;
global.mongoose = mongoose;
global.settings = settings;
global.redis = require('redis').createClient();

//-------------------------------------------------------//
// Route dependencies
//-------------------------------------------------------//
var route_index = require('./routes/index.js');
var route_auth = require('./routes/auth');
var route_API = require('./routes/API');
var route_mobile = require('./routes/mobile');
var route_admin = require('./routes/admin');
var route_topics = require('./routes/topics');

var models = require('./models');
global.models = models;

//-------------------------------------------------------//
// Middleware
//-------------------------------------------------------//
var requireLogin = require('./middlewares/requireLogin').requireLogin;

//---------------------------------------------------------------//
// Expressjs
//---------------------------------------------------------------//
var app = exports.app = express();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "whatnot1347" }));
  app.use(lessMiddleware({src: __dirname+'/public', compress: true}));
  app.use(express['static'](path.join(__dirname, 'public')));
  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/views');
  app.locals.pretty = true;
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.locals.pretty = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//---------------------------------------------------------------//
// Frontend routes (mobile mostly)
//---------------------------------------------------------------//
app.get('/', route_index);
app.get('/mobile/*', route_mobile.index);
app.get('/login', route_auth.login);
app.get('/auth', route_auth.auth);
app.get('/access_token', route_auth.access_token);
app.get('/logout', route_auth.logout);
app.get('/topics', route_topics.topics);
app.get('/load_topics.js', route_topics.load_topics);
app.post('/save_topics', route_topics.save_topics);

// this should only be used for tests
app.get('/__stub_session', route_auth.stub_session);

//---------------------------------------------------------------//
// Backend routes (admin CRUD)
//---------------------------------------------------------------//
app.get('/admin', route_admin);


//---------------------------------------------------------------//
// API (crud)
//---------------------------------------------------------------//

// a few helper api's
app.get('/api/me', requireLogin, route_API.me);
app.get('/api/my_topics', requireLogin, route_API.my_topics);
app.put('/api/my_topics/:id', requireLogin, route_API.save_my_topic);

app.get('/api/ready_users', route_API.ready_users);

app.post('/api/:collection', requireLogin, route_API.create);
app.get('/api/:collection', requireLogin, route_API.read);
app.get('/api/:collection/:id', requireLogin, route_API.read_one);
app.put('/api/:collection/:id', requireLogin, route_API.update);
app.delete('/api/:collection/:id', requireLogin, route_API.delete);

