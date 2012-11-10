
var mongoose = require('mongoose');

exports.melter = function (io) {

    io.sockets.on("connection", function (socket) {
        socket.on("ready", function (user, callback) {
            socket.set("user_id", user._id, function () {
                // in the future this will be partitioned by event
                
                models.linkedin_users.findById(user._id, function (err, user) {
                    if (!user) {
                        return callback();
                    }
                    find_matches(user, function (err, matches) {
                        if (matches.length > 0) {
                            melt(io, user, matches[0]);

                            if (callback) {
                                callback();
                            }
                        }else{
                            redis.sadd("ready_users", user._id, function () {
                                // tell everybody to update the ready view
                                io.sockets.emit("new ready");

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
                    io.sockets.emit("new ready");
                    if (callback) {
                        callback();
                    }
                });
            });
        });

        socket.on("disconnect", function () {
            socket.get("user_id", function (err, id) {
                redis.srem("ready_users", id);
                io.sockets.emit("new ready");
            });
        });

        socket.on("handshake", function (melt_id, me_index, callback) {

            models.melts.findById(melt_id, function (err, melt) {
                melt.users[me_index].handshaked = true;
                melt.users[me_index].handshake_time = new Date();

                melt.save(function () {
                    if (callback) {
                        callback();
                    }
                });
                
                if (melt.users[0].handshaked && melt.users[1].handshaked) {
                    io.sockets.in("melt_"+melt._id).emit("hands shook");
                }
            });
        });

        socket.on("melted", function (melt_id, index, callback) {

            models.melts.findById(melt_id, function (err, melt) {
                melt.users[index].melted = true;

                melt.save(function () {

                    if (callback) {
                        callback();
                    }
                });

                if (melt.users[0].melted && melt.users[1].melted) {
                    io.sockets.in("melt_"+melt._id).emit("finish melting");
                    finish_melt(melt);
                }
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
        }).filter(function (url) {
            return !!url;
        });

        past_melts(user, function (err, melts) {

            var matched = melts.map(function (melt) {
                if (""+melt.users[0]._id == ""+user._id) {
                    return melt.users[1]._id;
                }else{
                    return melt.users[0]._id;
                }
            });

            models.linkedin_users.find(
                {$and: [{_id: {$in: members}},
                        {_id: {$nin: matched}}],
                 publicUrl: {$nin: friendUrls}},
                "_id firstName lastName publicUrl topic1 topic2 topic3",
                function (err, matches) {
                    callback(null, matches || []);
                });       
        });
  
    });

};

var past_melts = exports.past_melts = function (user, callback) {

    models.melts.find({$or: [{"users.0._id": user._id},
                             {"users.1._id": user._id}],
                       finished: true},
                      callback);
                 
};


var melt = function (io, user1, user2) {
    //console.log("melting");

    var tell_user = function (socket, melt, user_index) {
        //console.log("telling user", melt._id, user_index);
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
                //console.log("timeouted");
                create_melt(user1, user2, callback);
            }, 300);
            return;
        }

        var spot = spots[0],
            melt = new models.melts();

        redis.srem("free_spots", spot);

        melt.spot = spot;
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
