var express = require('express'),
    http = require('http'),
    lessMiddleware = require('less-middleware'),
    settings = require('./settings'),
    routes = require('./routes');


//------------------------------------------------------------------------------------------------------//
// WEB SERVER
//------------------------------------------------------------------------------------------------------//
var app = express();


app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "whatnot1347" }));
    app.use(lessMiddleware({src: __dirname+'/public', compress: true}));
    app.use(express.static(__dirname + '/public'));
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


var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.listen(settings.port);

app.get('/', routes.index);
app.get('/auth', routes.auth);
app.get('/access_token', routes.access_token);
app.get('/logout', routes.logout);

app.post('/save_topics', routes.data.save_topics);
app.get('/topics.js', routes.data.topics);


console.log("listening on http://localhost:"+settings.port);
