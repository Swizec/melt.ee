var express = require('express'),
    http = require('http'),
    OAuth = require('oauth').OAuth,
    _ = require('underscore')._,
    step = require('step'),
    mongoose = require('mongoose'),
    db = mongoose.createConnection('localhost', 'meltee');

var users_schema;
var empty_schema;
var User;
var cl = console.log;

//------------------------------------------------------------------------------------------------------//
// Mongoose ORM
//------------------------------------------------------------------------------------------------------//
db.once('open', function() {
    users_schema = new mongoose.Schema({
        linkedin_id : String,
        firstName : String,
        lastName : String,
        headline : String,
        pictureUrl : String,
        publicUrl : String,
        creation_timestamp : { 'type': Date, 'default': Date.now },
        topic1 : String,
        topic2 : String,
        topic3 : String,
        is_admin : { 'type' : Boolean, 'default' : 0 }
    });
    empty_schema = new mongoose.Schema();
    User = db.model('linkedin_users', users_schema);
});

var g_user_info, g_connections;


//------------------------------------------------------------------------------------------------------//
// WEB SERVER
//------------------------------------------------------------------------------------------------------//
var app = express();
//app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "whatnot1347" }));
app.use(express['static'](__dirname + '/../public'));
app.use(express.favicon(__dirname + '/../public/img/favicon.ico'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
var server = http.createServer(app).listen(80);
var io = require('socket.io').listen(server);


// Request an OAuth Request Token, and redirects the user to authorize it
app.get('/auth', function(req, res) {

    var getRequestTokenUrl = "https://api.linkedin.com/uas/oauth/requestToken?scope=r_network";

    var oa = new OAuth(getRequestTokenUrl,
                      "https://api.linkedin.com/uas/oauth/accessToken",
                      "qm2c7dg5f6p4",
                      "XbD1qO2THjiWZyrt",
                      "1.0",
                      "http://meltee.rifelj.com/access_token",
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
});

app.get('/access_token', function(req, res) {
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

});

// Save topics
app.post('/save_topics', function(req, res) {
    step(
    function() {
        if(User && req.session) {
            User.find({ linkedin_id : req.session.user_sess.id }, this);
        } else {
            return false;
        }
    },
    function(err, result) {
        var post_data = req.body;
        User.update({ linkedin_id : result[0].linkedin_id },
                    { '$set' : { topic1 : post_data.topic1,
                                 topic2 : post_data.topic2,
                                 topic3 : post_data.topic3 }
                    }, this);
    },

    function(err, result) {
        res.writeHeader(200, { "Content-type" : "text/html; charset=utf-8" });
        res.end('Saved.', 'UTF-8');
    }
    
    );
});

// Load topics
app.get('/topics.js', function(req, res) {
    if(User && req.session.user_sess) {
        step(
        function() {
            User.find({ linkedin_id : req.session.user_sess.id }, this);
        },
        function(err, result) {
            var topics = {};
            if(_.size(result)) {
                topics = { topic1 : result[0].topic1 || '', topic2 : result[0].topic2 || '', topic3 : result[0].topic3 || '' };
            }
            console.log(topics);
            res.writeHeader(200, { "Content-type" : "application/json; charset=utf-8" });
            res.write('var topics = '+JSON.stringify(topics)+';', 'UTF-8');
            res.end();
        }
        );
    } else {
        console.log('NO User or session?!');
        res.writeHeader(200, { "Content-type" : "application/json; charset=utf-8" });
        res.write('var topics = {};', 'UTF-8');
        res.end();
    }
});

app.get('/logout', function(req, res) {
    delete req.session.oauth_access_token;
    delete req.session.user_sess;
    res.redirect('/');
});


app.get('/', function(req, res) {
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
});
console.log("listening on http://localhost:80");