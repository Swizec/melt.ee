
var mongoose = require('mongoose');

exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user, callback) {
            socket.set("user_id", user._id, function () {
                // in the future this will be partitioned by event
                
                models.linkedin_users.findById(user._id, function (err, user) {
                    console.log("got user");

                    find_matches(user, function (err, matches) {
                        if (matches.length > 0) {
                            console.log("matches", matches);
                            melt(io, user, matches[0]);

                            if (callback) {
                                callback();
                            }
                        }else{
                            console.log("no match");

                            redis.sadd("ready_users", user._id, function () {
                                if (callback) {
                                    callback();
                                }
                            });
                        }

                    });
                });                
            });
        });

        socket.on("not ready", function (callback) {
            socket.get("user_id", function (err, id) {
                redis.srem("ready_users", id, function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        });

        socket.on("disconnect", function () {
            socket.get("user_id", function (err, id) {
                redis.srem("ready_users", id);
            });
        });

        socket.on("handshake", function (melt_id, me_index, callback) {
            console.log(mongoose.Types.ObjectId(melt_id));
            models.melts.find({}, function (err, melts) {
                console.log(melts);
            });

            models.melts.findById(mongoose.Types.ObjectId(melt_id), function (err, melt) {
                if (!melt) return false;

                melt.users[me_index].handshaked = true;
                melt.users[me_index].handshake_time = new Date();

                melt.save(function () {
                    console.log("saving melt");
                    if (callback) {
                        callback();
                    }
                });
            });
        });

    });
};

var find_matches = exports.find_matches = function (user, callback) {

    redis.smembers("ready_users", function (err, members) {
        if (err) return callback(err);

        console.log("ready_users", members);

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
            callback(null, members || []);
        });

    });

};


var melt = function (io, user1, user2) {
    console.log("melting");

    var tell_user = function (socket, melt, user_index) {
        console.log("telling user", melt._id, user_index);
        socket.join("melt_"+melt._id);
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
    
    redis.multi()
        .srem("ready_users", ""+user1._id)
        .srem("ready_users", ""+user2._id)
        .exec(function () {

            find_socket(user1, function (socket1) {
                find_socket(user2, function (socket2) {
                    create_melt(user1, user2, function (err, melt) {
                    
                        tell_user(socket1, melt, 0);
                        tell_user(socket2, melt, 1);
                        
                    });
                });
            });

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
                console.log("timeouted");
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

        console.log("saving melt!", melt._id);
        
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
