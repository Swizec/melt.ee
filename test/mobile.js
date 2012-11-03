
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest');

var app = require('../app').app;

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
                                           lastName: "Carrol"});
        
        beforeEach(function (done) {
            user1.remove({linkedin_id: {$in: ["test_1", "test_2"]}}, function (err) {
                user1.save(function () {
                    user2.save(done);
                });
            });
        });
        
        describe("waiting in queue", function () {
            it("adds to queue", function (done) {
                console.log("BU");
                done();
            });
        });
        
    }, 300);
});
