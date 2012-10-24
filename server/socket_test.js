var express = require('express'),
    http = require('http');

var g_counter = 0;

var app = express();
app.use(express['static'](__dirname + '/../public'));
app.set('views', __dirname + '/views');
var server = http.createServer(app).listen(8080);
var io = require('socket.io').listen(server);

app.get('/', function(req, res) {
  res.render('socket_test.jade');
});

io.sockets.on('connection', function (socket) {
    if(g_counter === 0) {
        setInterval(function() {
            g_counter++;
            socket.emit('refresh', g_counter);
        }, 1000);
    }
    socket.on('msg_from_client', function(data) {
        console.log(data);
    });
});

console.log("listening on http://localhost:8080");