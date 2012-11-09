
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

    var tell_user = function (socket, melt, user_index) {
        socket.emit("melt", {_id: melt._id,
                             spot: melt.spot,
                             users: melt.users}, user_index);
    };

    var find_socket = function (user, callback) {
        // TODO: always O(N), to fix later
        io.sockets.clients().map(function (socket) {
            socket.get("user_id", function (err, id) {
                if (""+user._id == id) {
                    callback(socket);
                }
            });
        });
    };
    

    find_matches(user, function (err, matches) {
        if (matches.length > 0) {

            find_socket(matches[0], function (other_sock) {
                create_melt(user, matches[0], function (err, melt) {
                    
                    tell_user(socket, melt, 0);
                    tell_user(other_sock, melt, 1);
                        
                });
            });

        }
    });
};

var create_melt = exports.create_melt = function (user1, user2, callback) {
    var melter = function (u) {
        return {_id: u._id,
                firstName: u.firstName,
                lastName: u.lastName,
                topics: [u.topic1, u.topic2, u.topic3]};
                
    };

    redis.smembers("free_spots", function (err, spots) {
        if (spots.length < 1) {
            setTimeout(function () {
                create_melt(user1, user2, callback);
            }, 300);
            return;
        }

        var spot = spots[0],
            melt = models.melts({spot: spot,
                                 finished: false});

        redis.srem("free_spots", spot);

        melt.users.push(melter(user1));
        melt.users.push(melter(user2));
        
        melt.save(function (err) {
            callback(err, melt);
        });
    });
};

var finish_melt = exports.finish_melt = function (melt, callback) {

    redis.sadd("free_spots", melt.spot, function (err) {
        melt.finished = true;
        melt.finish_time = new Date();

        melt.save(callback);
    });

};
