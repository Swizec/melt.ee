
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

    it('redirects to topics when fresh user', function (done) {
        stub_session(function (cookie) {
            models.linkedin_users.find({}, function (err, result) {
                var user = result[0];

                user.topic1 = "";
                user.topic2 = "";
                user.topic3 = "";

                user.save(function () {
                    request(app)
                        .get('/mobile')
                        .set('cookie', cookie)
                        .expect(302)
                        .end(function (err, res) {
                            res.header.location.should.include('mobile/topics');
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
