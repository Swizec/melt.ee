
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    io = require('socket.io-client');

var app = require('../app').app,
    settings = require('../settings');

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
                                           lastName: "Wilde"}),
            user2 = models.linkedin_users({linkedin_id: "test_2",
                                           firstName: "Lewis",
                                           lastName: "Carrol"}),
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
                        user2.save(done);
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

            it("emits new ready", function (done) {
                var client1 = client();
                client1.once("connect", function () {
                    client1.once("ready", function (user) {
                        user.linkedin_id.should.equal("test_2");
                        user.firstName.should.equal("Lewis");
                        user.lastName.should.equal("Carrol");
                        
                        done();
                    });
                    
                    var client2 = client();
                    client2.once("connect", function () {
                        client2.emit("ready", user2);
                    });
                });
            });

            it("counts available melters", function (done) {
                var client1 = client(), 
                    client2 = client();
                client1.once("connect", function () {
                    client1.once("ready", function () {
                        request(app)
                            .get('/api/ready_users')
                            .expect(200)
                            .expect('Content-Type', /json/)                            
                            .end(function (err, result) {
                                result.body.count.should.equal(2);
                                
                                done();
                            });
                    });

                    client1.emit("ready", user1);
                    client2.emit("ready", user2);

                });
            });

            it("stores available melters", function (done) {
                var client1 = client(),
                    client2 = client();

                client1.once("connect", function () {
                    client1.once("ready", function () {
                        redis.smembers("ready_users", function (err, res) {
                            res.should.include(""+user1.id);

                            client2.emit("ready", user2);
                            client2.once("ready", function () {
                                redis.smembers("ready_users", function (err, res) {
                                    res.should.include(""+user1.id);
                                    res.should.include(""+user2.id);
                                    done();
                                });
                            });

                        });
                    });

                    client1.emit("ready", user1);
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
