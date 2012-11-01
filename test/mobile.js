
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    superagent = require('superagent');

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
