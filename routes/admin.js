module.exports = function(req, res) {
    
    console.log('USER SESSION (in routes/admin.js)');
    console.log(req.session.user_sess);

    if(!req.session.user_sess) {
        req.session.redirect = 'admin';
        res.redirect('/auth');
    } else {
        res.render('admin.jade');
    }
};