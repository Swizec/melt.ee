
exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user) {
            socket.set("user_id", user._id, function () {
                // in the future this will be partitioned by event
                redis.sadd("ready_users", user._id, function (err) {
                    io.sockets.emit("ready", user);
                });
            });
        });

        socket.on("disconnect", function () {
            socket.get("user_id", function (err, id) {
                redis.srem("ready_users", id);
            });
        });
    });
};
