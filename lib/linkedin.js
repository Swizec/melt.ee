
var OAuth = require('oauth').OAuth,
    _ = require('underscore');

exports.Linkedin = function (session) {
    this.session = session;
    this.oa = new OAuth(session.oa._requestUrl,
                        session.oa._accessUrl,
                        session.oa._consumerKey,
                        session.oa._consumerSecret,
                        session.oa._version,
                        session.oa._authorize_callback,
                        session.oa._signatureMethod);

    return this;
};

_.extend(exports.Linkedin.prototype, {

    __people: function (options, callback) {
        var opts = _.defaults(options, {
            user: "~",
            property: "",
            fields: ""
        });

        this.oa.getProtectedResource(
            "http://api.linkedin.com/v1/people/"+opts.user+"/"+opts.property+opts.fields+"?format=json",
            "GET",
            this.session.oauth_access_token,
            this.session.oauth_access_token_secret,
            function (err, data) {
                callback(err, JSON.parse(data).values);
            });
    },

    connections: function (user, callback) {
        if (_.isFunction(user)) {
            callback = user;
            user = "~";
        }

        this.__people({user: user, 
                       property: "connections"}, callback);
    }

});
