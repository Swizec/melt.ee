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
             } else {
                // store the access token in the session
                req.session.oauth_access_token = oauth_access_token;
                req.session.oauth_access_token_secret = oauth_access_token_secret;
                //res.redirect((req.param('action') && req.param('action') !== "") ? req.param('action') : "/");
                
                var ua = req.headers['user-agent'].toLowerCase();
                res.redirect('/login');
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
            }else if (mobile_user(req)) {
                return res.redirect('/mobile/');
            }
             
            res.redirect('/topics');
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
                is_admin : person.is_admin
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

                var is_admin = 0;
                if(user) {
                    is_admin = user.is_admin;
                }
                // create session
                req.session.user_sess = {
                    id : person.id,
                    name : person.firstName +' '+ person.lastName,
                    is_admin : is_admin,
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
                                       is_admin : row.is_admin,
                                       url : row.publicProfileUrl,
                                       img_src : row.pictureUrl || '',
                                       headline : row.headline || ''
                                   };

                                   
                                   res.send(row);
                               });

};


var mobile_user = function (req) {
    if (req.headers['user-agent']) {
        var ua = req.headers['user-agent'].toLowerCase();
    }else{
        //this happens in tests :)
        var ua = "";
    }

    // my god this is an unruly regex
    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4));

};
