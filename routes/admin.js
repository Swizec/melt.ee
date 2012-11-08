module.exports = function(req, res) {
    
    //console.log('USER SESSION (in routes/admin.js)'); console.log(req.session.user_sess);

    if(!req.session.user_sess) {
        req.session.redirect = 'admin';
        res.redirect('/auth');
    } else {
        console.log(req.session.user_sess);
        if(req.session.user_sess.is_admin == '1') {
            res.render('admin.jade');
        } else {
            res.redirect('/');
        }
    }
};
