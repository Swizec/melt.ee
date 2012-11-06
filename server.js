
var app = require('./app').app;

//------------------------------------------------------------------//
// Create server
//------------------------------------------------------------------//
var server = exports.server = app.listen(settings.port);
var io = require('socket.io').listen(server);
io.set("log level", 0);

var melter = require('./lib/melter').melter(io);

console.log("Express server listening on port " + settings.port);
