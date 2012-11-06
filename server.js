
var app = require('./app').app;

//------------------------------------------------------------------//
// Create server
//------------------------------------------------------------------//
var server = app.listen(settings.port);
var io = require('socket.io').listen(server);
console.log("Express server listening on port " + settings.port);
