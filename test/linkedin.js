
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var Linkedin = require('../lib/linkedin').Linkedin;

var session_stub = {
  oa: 
   { _isEcho: false,
     _requestUrl: 'https://api.linkedin.com/uas/oauth/requestToken?scope=r_network',
     _accessUrl: 'https://api.linkedin.com/uas/oauth/accessToken',
     _consumerKey: 'qm2c7dg5f6p4',
     _consumerSecret: 'XbD1qO2THjiWZyrt',
     _version: '1.0',
     _authorize_callback: 'http://192.168.1.1:3000/access_token',
     _signatureMethod: 'HMAC-SHA1',
     _nonceSize: 32 },
  oauth_token: 'b2683701-4550-4c59-8e7c-0b2c2b1d5743',
  oauth_token_secret: '3972e88f-07fe-4e43-9780-fb645e56ed3f',
  oauth_access_token: '57f2497b-ca5c-45b2-8e99-cec22ecbc84d',
  oauth_access_token_secret: 'd1aac19e-0e71-4ac1-a25f-a2e4607cd3cf' };


describe("LinkedIn helper", function () {
    
    var api = new Linkedin(session_stub);
    
    it("lists friends", function (done) {
        
        api.connections(function (err, conns) {
            conns.length.should.be.above(5);

            done();
        });

    });

    it("accepts fields", function (done) {
        
        api.__people({fields: ["first-name", "last-name"]},
                     function (err, data) {
                         data.should.have.keys(["firstName", "lastName"]);

                         done();
                     });

    });

});

