var OAuth = require('oauth').OAuth,
    Linkedin = require('../lib/linkedin').Linkedin;

exports.auth = function(req, res){
    var getRequestTokenUrl = "https://api.linkedin.com/uas/oauth/requestToken?scope=r_network";

    var oa = new OAuth(getRequestTokenUrl,
                      "https://api.linkedin.com/uas/oauth/accessToken",
                      "qm2c7dg5f6p4",
                      "XbD1qO2THjiWZyrt",
                      "1.0",
                      settings.base_url+"/access_token",
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

exports.access_token = function(req, res){
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
                //res.redirect((req.param('action') && req.param('action') !== "") ? req.param('action') : "/");
                res.redirect('/');
             }
    });
};

exports.login = function(req, res) {

    //--------------------------------------------------------------//
    // No session, user is NOT logged in, show LINKEDin button
    //--------------------------------------------------------------//
    if(!req.session.oauth_access_token) {
        res.render('login.jade', {});
    } else {
        //-------------------------------------------------------------------//
        // User comes from linkedin auth (every time, yes)
        //-------------------------------------------------------------------//
        var linkedin = new Linkedin(req.session),
            users = models.linkedin_users; // smaller code :)

        var finish = function (err) {
            if(err) {
                console.log('Error saving person...');
                console.log(err);
            }
            
            if (req.session.redirect == 'admin') {
                delete req.session.redirect;
                return res.redirect('/admin');
            }
            
            res.redirect('/');
        };

        // TODO: eventually move this to a central part of codebase handling data
        var create_user = function (person, callback) {
            var user = users({
                linkedin_id : person.id,
                firstName : person.firstName,
                lastName : person.lastName,
                headline : person.headline,
                pictureUrl : person.pictureUrl,
                publicUrl : person.publicProfileUrl,
                is_admin : 0
            });
            
            add_connections(user, callback);
        };

        var add_connections = function (user, callback) {
            linkedin.connections(function (err, conns) {
                conns.map(function (person) {
                    user.connections.push({firstName: person.firstName,
                                           lastName: person.lastName,
                                           linkedin_id: person.id,
                                           publicUrl: person.publicUrl
                                          });
                });

                user.save(callback);
            });
        };

        linkedin.me(function (err, person) {

            users.findOne({linkedin_id: person.id}, function (err, user) {

                // create session
                req.session.user_sess = {
                    id : person.id,
                    name : person.firstName +' '+ person.lastName,
                    is_admin : (user) ? user.is_admin : 0,
                    url : person.publicProfileUrl,
                    img_src : person.pictureUrl || '',
                    headline : person.headline || ''
                };

                if (!user) {
                    // new user
                    create_user(person, finish);
                }else if (user.connections.length <= 0) {
                    // needs connections
                    add_connections(user, finish);
                }else{
                    // we're done here
                    finish();
                }

            });

        });
    };
};

exports.logout = function(req, res) {
    delete req.session.oauth_access_token;
    delete req.session.user_sess;
    res.redirect('/');
};

exports.stub_session = function (req, res) {
    var user_id = req.headers['x-user-id'];
    
    req.session = _.extend(req.session, {oa: 
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
  oauth_access_token_secret: 'd1aac19e-0e71-4ac1-a25f-a2e4607cd3cf' });

    models.linkedin_users.find({linkedin_id: user_id},
                               function (err, result) {
                                   var row = result[0];
                                   if (!row) {
                                       return res.send("No user");
                                   }
                                   req.session.user_sess = {
                                       id : row.linkedin_id,
                                       name : row.firstName +' '+ row.lastName,
                                       is_admin : 0,
                                       url : row.publicProfileUrl,
                                       img_src : row.pictureUrl || '',
                                       headline : row.headline || ''
                                   };

                                   
                                   res.send(row);
                               });

};
