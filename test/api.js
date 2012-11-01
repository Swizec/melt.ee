
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var request = require('supertest');

var app = require('../app').app,
    models = require('../models');

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
    }, 100);
};

describe('Helper APIs', function () {
    
    it('returns me', function (done) {
        stub_session(function (cookie) {
            request(app)
                .get('/api/me')
                .set('cookie', cookie)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {

                    res.body[0].should.have.property('firstName');
                    res.body[0].should.have.property('lastName');
                    res.body[0].should.have.property('linkedin_id');
                    for (var i=1; i<=3; i++) {
                        res.body[0].should.have.property('topic'+i);
                    }

                    done();
                });
        });
    });

    it('returns my topics', function (done) {
        stub_session(function (cookie) {
            request(app)
                .get('/api/my_topics')
                .set('cookie', cookie)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    res.body.length.should.equal(3);
                    res.body.map(function (item) {
                        item.should.have.property('topic');
                        item.should.have.property('id');
                    });

                    done();
                });
        });
    });

    it('saves topics', function (done) {
        stub_session(function (cookie) {
            request(app)
                .get('/api/my_topics')
                .set('cookie', cookie)
                .expect(200)
                .end(function(err, res) {
                    var topic = res.body[0];
                    topic.topic = "CHANGED VERY MUCH";

                    request(app)
                        .put('/api/my_topics/'+topic.id)
                        .set('cookie', cookie)
                        .send(topic)
                        .expect(200)
                        .end(function (err, res) {
                            
                            request(app)
                                .get('/api/my_topics')
                                .set('cookie', cookie)
                                .expect(200)
                                .end(function (err, res) {

                                    res.body.map(function (_topic) {
                                        if (_topic.id == topic.id) {
                                            _topic.topic.should.equal('CHANGED VERY MUCH');
                                        }
                                    });

                                    done();
                                });
                        });
                });
        });
    });

});
