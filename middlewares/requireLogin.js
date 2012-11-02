
exports.requireLogin = function (req, res, next) {
    if (!req.session.user_sess) {
        return res.send(401, "Login required");
    }

    next();
};
