
exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user) {
            io.sockets.emit("ready", user);
        });
    });
};
