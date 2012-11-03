
exports.index = function (req, res) {
    if (!req.session.user_sess) {
        // user needs to login
        return res.redirect('/login');
    }

    res.render('mobile.jade', req.session.user_sess);
};

