
/*
 * GET home page.
 */

var OAuth = require('oauth').OAuth,
    _ = require('underscore')._,
    step = require('step'),
    mongoose = require('mongoose'),
    db = mongoose.createConnection('localhost', 'meltee'),
    settings = '../settings';

exports.data = require('./data');

exports.index = function(req, res) {
    if(req.session.user_sess) {
        // User is logged in, replace jade template with user's session details
        res.render('main.jade', req.session.user_sess);
    } else {
        //--------------------------------------------------------------//
        // No session, user is NOT logged in, show LINKEDin button
        //--------------------------------------------------------------//
        if(!req.session.oauth_access_token) {
            res.render('index.jade', {});
        } else {
            //-------------------------------------------------------------------//
            // User comes from linkedin auth (every time, yes)
            //-------------------------------------------------------------------//
            var oa = new OAuth(req.session.oa._requestUrl,
                              req.session.oa._accessUrl,
                              req.session.oa._consumerKey,
                              req.session.oa._consumerSecret,
                              req.session.oa._version,
                              req.session.oa._authorize_callback,
                              req.session.oa._signatureMethod);
           

            oa.getProtectedResource(
                "http://api.linkedin.com/v1/people/~:(id,first-name,last-name,headline,picture-url,public-profile-url)?format=json",
                "GET",
                req.session.oauth_access_token,
                req.session.oauth_access_token_secret,
                function (error, data, response) {
                    
                    var person = JSON.parse(data);
                    console.log(person);
                    if(User) {
                        step(

                        function() {
                            User.find({ linkedin_id : person.id }, this);
                        },
                        
                        function(err, result) {
                            if(_.size(result)) {
                                //------------------------------//
                                // Existing user, create session
                                //------------------------------//
                                var row = result[0];
                                req.session.user_sess = {
                                    id : person.id,
                                    name : person.firstName +' '+ person.lastName,
                                    is_admin : row.is_admin,
                                    url : person.publicProfileUrl,
                                    img_src : person.pictureUrl || '',
                                    headline : person.headline || ''
                                };
                                return false; //call next step's function
                            } else {
                                //------------------------------//
                                // New user, create session
                                //------------------------------//
                                req.session.user_sess = {
                                    id : person.id,
                                    name : person.firstName +' '+ person.lastName,
                                    is_admin : 0,
                                    url : person.publicProfileUrl,
                                    img_src : person.pictureUrl || '',
                                    headline : person.headline || ''
                                };

                                var is_admin = 0;
                                
                                var new_user = User({ linkedin_id : person.id,
                                                      firstName : person.firstName,
                                                      lastName : person.lastName,
                                                      headline : person.headline,
                                                      pictureUrl : person.pictureUrl,
                                                      publicUrl : person.publicProfileUrl,
                                                      is_admin : is_admin });

                                //Trying to save new user...
                                new_user.save(function(err) {
                                    if(err) {
                                        console.log('Error saving person...');
                                        console.log(err);
                                    }
                                    return false; //call next step's function
                                });
                            }
                        },
                        function(err) {
                            res.render('main.jade', req.session.user_sess);
                        }
                        ); //step
                    }
                }
            );
        }
    }
};

// Request an OAuth Request Token, and redirects the user to authorize it
exports.auth = function(req, res) {

    var getRequestTokenUrl = "https://api.linkedin.com/uas/oauth/requestToken?scope=r_network";

    var oa = new OAuth(getRequestTokenUrl,
                      "https://api.linkedin.com/uas/oauth/accessToken",
                      "qm2c7dg5f6p4",
                      "XbD1qO2THjiWZyrt",
                      "1.0",
                      settings.domain+"/access_token",
                      "HMAC-SHA1");

    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
      if(error) {
             console.log('error');
             console.log(error);
        }
      else {
            // store the tokens in the session
            req.session.oa = oa;
            req.session.oauth_token = oauth_token;
            req.session.oauth_token_secret = oauth_token_secret;

            // redirect the user to authorize the token
           res.redirect("https://www.linkedin.com/uas/oauth/authenticate?oauth_token="+oauth_token);
      }
    });
};

exports.access_token = function(req, res) {
// Callback from Linkedin
// get the OAuth access token with the 'oauth_verifier' that we received
    var oa = new OAuth(req.session.oa._requestUrl,
                      req.session.oa._accessUrl,
                      req.session.oa._consumerKey,
                      req.session.oa._consumerSecret,
                      req.session.oa._version,
                      req.session.oa._authorize_callback,
                      req.session.oa._signatureMethod);
    oa.getOAuthAccessToken(
        req.session.oauth_token,
        req.session.oauth_token_secret,
        req.param('oauth_verifier'),
        function(error, oauth_access_token, oauth_access_token_secret, results2) {

            if(error) {
                console.log('error');
                console.log(error);
             }
             else {
                // store the access token in the session
                req.session.oauth_access_token = oauth_access_token;
                req.session.oauth_access_token_secret = oauth_access_token_secret;

                res.redirect((req.param('action') && req.param('action') !== "") ? req.param('action') : "/");
             }

    });

};

exports.logout = function(req, res) {
    delete req.session.oauth_access_token;
    delete req.session.user_sess;
    res.redirect('/');
};
