
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    io = require('socket.io-client');

var app = require('../app').app,
    settings = require('../settings'),
    melter = require('../lib/melter');

describe('Mobile site', function () {

    it('redirects to topics when fresh user', function (done) {
        stub_session(function (cookie) {
            models.linkedin_users.find({}, function (err, result) {
                var user = result[0];

                user.topic1 = "";
                user.topic2 = "";
                user.topic3 = "";

                user.save(function () {
                    request(app)
                        .get('/mobile/')
                        .set('cookie', cookie)
                        .expect(302)
                        .end(function (err, res) {
                            res.header.location.should.include('mobile/topics/');
                            done();
                        });
                });
            });
        });
    });

    it("doesn't do a redirect to topics loop", function (done) {
        stub_session(function (cookie) {
            models.linkedin_users.find({}, function (err, result) {
                var user = result[0];

                user.topic1 = "";
                user.topic2 = "";
                user.topic3 = "";

                user.save(function () {
                    request(app)
                        .get('/mobile/topics')
                        .set('cookie', cookie)
                        .expect(200, done);
                });
            });
        });
    });
});

describe("melting", function () {
    setTimeout(function () { // give db time to connect
        var db = models.linkedin_users,
            user1 = models.linkedin_users({linkedin_id: "test_1",
                                           firstName: "Oscar",
                                           lastName: "Wilde",
                                           publicUrl: "http://linkedin.com/test_1",
                                           connections: [],
                                           topic1: "a",
                                           topic2: "b",
                                           topic3: "c"}),
            user2 = models.linkedin_users({linkedin_id: "test_2",
                                           firstName: "Lewis",
                                           lastName: "Carrol",
                                           publicUrl: "http://linkedin.com/test_2",
                                           connections: [],
                                           topic1: "a",
                                           topic2: "b",
                                           topic3: "c"}),
            user3 = models.linkedin_users({linkedin_id: "test_3",
                                           firstName: "Anne",
                                           lastName: "Rice",
                                           publicUrl: "http://linkedin.com/test_3",
                                           connections: [user1],
                                           topic1: "a",
                                           topic2: "b",
                                           topic3: "c"}),
            options ={
                transports: ['websocket'],
                'force new connection': true
            },
            server;

        var client = function () {
            return io.connect(settings.base_url, options);
        };

        
        beforeEach(function (done) {
            // start server
            server = require('../server').server;
            redis.multi()
                .del("ready_users")
                .sadd("free_spots", 1)
                .sadd("free_spots", 2)
                .sadd("free_spots", 3)
                .exec(function (err) {
                    models.melts.remove(function () {
                        db.create(user1, function () {
                            db.create(user2, function () {
                                db.create(user3, function () {
                                    done();
                                });
                            });
                        });
                    });
                });
        });
        
        afterEach(function (done) {
            db.remove({linkedin_id: {$in: ["test_1", "test_2", "test_3"]}}, 
                      function (err) {
                          done();
                      });
        });
        
        describe("waiting for melt", function () {
            it("socket.io connectable", function (done) {
                var client1 = client();
                client1.once("connect", function (data) {                    
                    done();
                });
            });

            it("executes ready callback", function (done) {
                var client1 = client();

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        done();
                    });
                });
            });

            it("counts available melters", function (done) {
                var client1 = client(),
                    client2 = client();
                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        client2.emit("ready", user3, function () {

                            request(app)
                                .get('/api/ready_users')
                                .expect(200)
                                .expect('Content-Type', /json/)
                                .end(function (err, result) {
                                    result.body.count.should.equal(2);
                                
                                    done();
                                });
                        });
                    });
                });
            });

            it("stores available melters", function (done) {
                var client1 = client(),
                    client2 = client();

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        redis.smembers("ready_users", function (err, res) {
                            res.should.include(""+user1.id);

                            client2.emit("ready", user3, function () {
                                redis.smembers("ready_users", function (err, res) {
                                    res.should.include(""+user1.id);
                                    res.should.include(""+user3.id);
                                    done();
                                });
                            });

                        });
                    });
                });

            });

            it("removes disconnected melters", function (done) {
                var client1 = client();

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        client1.disconnect();
                        
                        setTimeout(function () {
                            redis.smembers("ready_users", function (err, res) {
                                res.should.not.include(""+user1.id);
                                done();
                            });
                        }, 300);

                    });
                });
            });

            it("unreadies users", function (done) {
                var client1 = client();

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        redis.smembers("ready_users", function (err, res) {
                            res.should.include(""+user1.id);

                            client1.emit("not ready", function () {
                                redis.smembers("ready_users", function (err, res) {
                                    res.should.not.include(""+user1.id);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        describe("User matching", function (done) {
            
            it("is empty when nobody", function (done) {
                redis.sadd("ready_users", user1._id, function () {
                    
                    melter.find_matches(user1, function (err, matches) {
                        matches.length.should.equal(0);
                        done();
                    });

                });

            });
            
            it("matches two available users", function (done) {
                redis.multi()
                    .sadd("ready_users", user1._id)
                    .sadd("ready_users", user2._id)
                    .exec(function () {

                        melter.find_matches(user1, function (err, matches) {
                            matches.length.should.equal(1);
                            matches[0]._id.toString().should.equal(""+user2._id);
                            
                            done();
                        });
                    
                });
            });

            it("doesn't match friends", function (done) {
                redis.multi()
                    .sadd("ready_users", user1._id)
                    .sadd("ready_users", user3._id)
                    .exec(function () {
                        
                        melter.find_matches(user3, function (err, matches) {
                            matches.length.should.equal(0);

                            done();
                        });
                    });
            });

            it("finds good match", function (done) {
                redis.multi()
                    .sadd("ready_users", user1._id)
                    .sadd("ready_users", user2._id)
                    .sadd("ready_users", user3._id)
                    .exec(function () {
                        
                        melter.find_matches(user3, function (err, matches) {
                            matches.length.should.equal(1);
                            matches[0]._id.toString().should.equal(""+user2._id);
                            
                            matches[0].toObject().should.have.keys(
                                ["_id", "firstName", "lastName", "publicUrl",
                                 "topic1", "topic2", "topic3"]);

                            done();
                        });
                    });
            });

        });

        describe("Creating melts", function () {

            it("emits melt prompt", function (done) {
                var client1 = client(),
                    client2 = client(),
                    twice = 0,
                    _done = function () {
                        twice += 1;

                        if (twice >= 2) {
                            done();
                        }
                    };

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        client2.emit("ready", user2, function () {
                        });
                    });

                    client1.once("melt", function (melt, me_index) {
                        _done();
                    });

                    client2.once("melt", function (melt, me_index) {
                        _done();
                    });
                });
            });

            it("creates a melt", function (done) {
                
                melter.create_melt(user1, user2, function () {
                    models.melts.find({},
                        function (err, melts) {
                            melts.length.should.equal(1);

                            melts[0].toObject().should.have.keys(
                                ["_id", "__v", "users", "creation_time", "finish_time",
                                 "spot", "finished"]);
                            
                            melts[0].users.map(function (user) {
                                user.toObject().should.have.keys(
                                    ["_id", "topics", "firstName", "lastName", 
                                     "handshake_time", "handshaked"]);
                            });
                            
                            done();
                        });
                    
                });
            });

            it("tells client melt data", function (done) {
                
                var client1 = client(),
                    client2 = client(),
                    twice = 0,
                    _done = function () {
                        twice += 1;

                        if (twice >= 2) {
                            done();
                        }
                    };

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        client2.emit("ready", user2);
                    });

                    client1.once("melt", function (melt, me_index) {
                        melt.should.have.keys(["_id", "spot", "users"]);
                        melt.users[me_index]._id.should.equal(""+user1._id);
                        
                        _done();
                    });


                    client2.once("melt", function (melt, me_index) {
                        melt.should.have.keys(["_id", "spot", "users"]);
                        melt.users[me_index]._id.should.equal(""+user2._id);

                        _done();
                    });
                });
            });

            it("selects empty spot", function (done) {
                
                melter.create_melt(user1, user2, function (err, melt1) {
                    melter.create_melt(user2, user3, function (err, melt2) {
                        melt1.spot.should.not.equal(melt2.spot);

                        redis.smembers("free_spots", function (err, spots) {
                            spots.should.not.contain(melt1.spot, melt2.spot);
                            
                            done();
                        });
                    });
                });
                
            });

            it("waits for free spot", function (done) {
                
                redis.del("free_spots", function (err) {
                    
                    melter.create_melt(user1, user2, function (err, melt) {
                        melt.spot.should.equal(2);
                        
                        done();
                    });
                    
                    setTimeout(function () { redis.sadd("free_spots", 2); },
                               500);
                });

            });

        });

        describe("Doing melts", function () {

            it("finishes melts", function (done) {
                melter.create_melt(user1, user2, function (err, melt) {
                    melter.finish_melt(melt, function (err) {
                        
                        models.melts.findOne({_id: melt._id}, function (err, melt) {
                            melt.finished.should.equal(true);
                            melt.finish_time.should.not.equal(null);

                            redis.smembers("free_spots", function (err, spots) {
                                spots.should.contain(""+melt.spot);
                            });

                            done();
                            
                        });

                    });
                });
            });

            it("does handshakes", function (done) {
                var client1 = client(),
                    client2 = client(),
                    twice = 0,
                    _done = function () {
                        twice += 1;

                        if (twice >= 2) {
                            done();
                        }
                    };

                client1.once("connect", function () {
                    client1.emit("ready", user1, function () {
                        client2.emit("ready", user2);
                    });

                    client1.once("melt", function (melt, me_index) {
                        
                        setTimeout(function () {
                            client1.emit("handshake", melt._id, me_index, function () {
                                models.melts.findById(melt._id, function (err, _melt) {
                                    var me = _melt.users[me_index];
                                    me.handshake_time.should.not.equal(null);
                                    me.handshaked.should.equal(true);

                                    _done(); // makes test incomplete
                                });
                            });
                        }, 200);

                        client1.once("hands shook", function () {
                            _done();
                        });
                    });


                    client2.once("melt", function (melt, me_index) {
                        
                        setTimeout(function () {
                            client2.emit("handshake", melt._id, me_index, function () {
                                models.melts.findById(melt._id, function (err, _melt) {
                                    var me = _melt.users[me_index];
                                    me.handshake_time.should.not.equal(null);
                                    me.handshaked.should.equal(true);

                                    _done(); // makes test incomplete
                                });
                            });
                        }, 100);

                        client2.once("hands shook", function () {
                            _done();
                        });
                    });
                });

            });

        });
        
    }, 300);
});


var stub_session = function (callback) {
    // give db time to connect
    setTimeout(function () { 
    models.linkedin_users.find({}, function (err, result) {
        //console.log(models.linkedin_users);
        //console.log("ID", result[0].linkedin_id);
        request(app)
            .get('/__stub_session')
            .set('X-User-Id', result[0].linkedin_id)
            .expect(200)
            .end(function (err, res) {
                callback(res.header['set-cookie']);
            });
    });
    }, 500);
};
