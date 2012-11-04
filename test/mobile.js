
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    io = require('socket.io-client');

var app = require('../app').app,
    settings = require('../settings');

describe('Mobile site', function () {

    it('redirects to login', function (done) {
        request(app)
            .get('/mobile')
            .expect(302)
            .end(function (err, res) {
                res.headers.location.should.equal('/login');
                done();
            });
    });

    it('starts oauth', function (done) {
        request(app)
            .get('/auth')
            .expect(302)
            .end(function (err, res) {
                res.header.location.should.include('https://www.linkedin.com/uas/oauth/authenticate');
                done();
            });
    });

    it('stubs session', function (done) {
        var API = db.model('linkedin_users', new mongoose.Schema());
        API.find({}).execFind(function (err, result) {
            request(app)
                .get('/__stub_session')
                .set('X-User-Id', result[0].linkedin_id)
                .expect(200)
                .end(function (err, res) {
                    request(app)
                        .get('/mobile')
                        .set('cookie', res.header['set-cookie'])
                        .expect(200, done);
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

        
        beforeEach(function (done) {
            // start server
            server = require('../server').server;
            db.remove({linkedin_id: {$in: ["test_1", "test_2"]}}, function (err) {
                user1.save(function () {
                    user2.save(done);
                });
            });
        });
        
        describe("waiting for melt", function () {
            it("socket.io connectable", function (done) {
                var client1 = io.connect(settings.base_url, options);    
                client1.on("connect", function (data) {                    
                    done();
                });
            });

            it("emits new ready", function (done) {
                var client1 = io.connect(settings.base_url, options);
                client1.on("connect", function () {
                    client1.on("ready", function (user) {
                        user.linkedin_id.should.equal("test_2");
                        user.firstName.should.equal("Lewis");
                        user.lastName.should.equal("Carrol");

                        done();
                    });
                    
                    var client2 = io.connect(settings.base_url, options);
                    client2.on("connect", function () {
                        client2.emit("ready", user2);
                    });
                });
            });
        });
        
    }, 300);
});
