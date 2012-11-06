
exports.index = function (req, res) {
    if (!req.session.user_sess) {
        // user needs to login
        return res.redirect('/login');
    }

    // see if user needs to fill in topics
    models.linkedin_users.findOne({linkedin_id: req.session.user_sess.id},
        function (err, result) {
            // disable everything until launch
            if (new Date() < new Date(2012, 11, 10, 15, 00)
                && settings.dev_ips.indexOf(req.ip) < 0){
                return res.render('mobile-disabled.jade', req.session.user_sess);
            }

            if (result.topic1+result.topic2+result.topic3 === ""
                && !req.path.match(/\/topics/)) {
                return res.redirect('/mobile/topics/events');
            }
                    
            res.render('mobile.jade', req.session.user_sess);
        });
};
