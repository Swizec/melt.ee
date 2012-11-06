
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest'),
    io = require('socket.io-client');

var app = require('../app').app,
    settings = require('../settings');


describe('Auth', function () {
    
    it('redirects to login', function (done) {
        request(app)
            .get('/mobile/')
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
                        .get('/mobile/')
                        .set('cookie', res.header['set-cookie'])
                        .expect(200, done);
                });
        });
    });

    it('fetches friends of new user', function (done) {

        stub_session(function (cookie, me_id) {
            models.linkedin_users.find({linkedin_id: me_id}, function (err, user) {
                user[0].connections = [];
                user[0].save();

                request(app)
                    .get('/login')
                    .set('cookie', cookie)
                    .expect(200)
                    .end(function (err, res) {
                        models.linkedin_users.find(
                            {linkedin_id: me_id}, 
                            function (err, res) {
                                res[0].connections.should.have.length.above(5);
                            });
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
                callback(res.header['set-cookie'], result[0].linkedin_id);
            });
    });
    }, 500);
};
