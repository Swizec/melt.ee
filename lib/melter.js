
var mongoose = require('mongoose');

exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user, callback) {
            socket.set("user_id", user._id, function () {
                // in the future this will be partitioned by event
                redis.sadd("ready_users", user._id, function (err) {
                    models.linkedin_users.findById(user._id, function (err, user) {
                        melt(io, socket, user);

                        if (callback) {
                            callback();
                        }
                    });
                });
            });
        });

        socket.on("not ready", function (callback) {
            socket.get("user_id", function (err, id) {
                redis.srem("ready_users", id, function () {
                    callback();
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

var find_matches = exports.find_matches = function (user, callback) {

    redis.smembers("ready_users", function (err, members) {
        if (err) return callback(err);

        members = _.without(members, ""+user._id).map(function (member) {
            return mongoose.Types.ObjectId(member);
        });

        var friendUrls = user.connections.map(function (friend) {
            return friend.publicUrl;
        });

        models.linkedin_users.find({_id: {$in: members},
                                    publicUrl: {$nin: friendUrls}},
                                   "firstName lastName _id publicUrl", 
                                   function (err, members) {
            callback(null, members);
        });

    });

};


var melt = function (io, socket, user) {
    find_matches(user, function (err, matches) {
        if (matches.length > 0) {
            socket.emit("melt", matches[0]);
            
            // TODO: always O(N), to fix later
            io.sockets.clients().map(function (other_sock) {
                other_sock.get("user_id", function (err, other_id) {
                            if (""+matches[0]._id == other_id) {
                                create_melt(user, matches[0], function () {
                                    other_sock.emit("melt", user);
                                });
                            }
                });
            });
        }
    });
};

var create_melt = function (user1, user2, callback) {
    var melter = function (u) {
        return {_id: u._id,
                firstName: u.firstName,
                lastName: u.get("lastName"),
                topics: [u.get("topic1")]};
                
    };

    var melt = models.melts({spot: 1,
                            finished: false});
    melt.users.push(melter(user1));
    melt.users.push(melter(user2));

    melt.save(function (err) {
        console.log(err);
        callback();
    });
};
