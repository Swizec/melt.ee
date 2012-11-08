
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
                                           connections: []}),
            user2 = models.linkedin_users({linkedin_id: "test_2",
                                           firstName: "Lewis",
                                           lastName: "Carrol",
                                           publicUrl: "http://linkedin.com/test_2",
                                           connections: []}),
            user3 = models.linkedin_users({linkedin_id: "test_3",
                                           firstName: "Anne",
                                           lastName: "Rice",
                                           publicUrl: "http://linkedin.com/test_3",
                                           connections: [user1]}),
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
            redis.del("ready_users", function (err) {
                db.remove({linkedin_id: {$in: ["test_1", "test_2"]}}, function (err) {
                    user1.save(function () {
                        user2.save(function () {
                            user3.save(done);
                        });
                    });
                });
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
                        client2.emit("ready", user2, function () {

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

                            client2.emit("ready", user2, function () {
                                redis.smembers("ready_users", function (err, res) {
                                    res.should.include(""+user1.id);
                                    res.should.include(""+user2.id);
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
                redis.sadd(user1._id, function () {
                    
                    melter.find_matches(user1, function (err, matches) {
                        matches.length.should.be(0);
                        done();
                    });

                });
            });
            
            it("matches two available users", function (done) {
                redis.sadd([user1._id, user2._id], function () {

                    melter.find_matches(user1, function (err, matches) {
                        matches.should.contain(user2);

                        done();
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
