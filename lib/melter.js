
exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user) {
            // in the future this will be partitioned by event
            redis.incr("ready_users", function () {
                socket.broadcast.emit("ready", user);
            });
        });

        socket.on("disconnect", function () {
            redis.decr("ready_users");
        });
    });
};
