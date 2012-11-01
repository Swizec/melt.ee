
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    http = require('http');

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
});
