
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
            fields: []
        }),
            params = "";

        if (opts.fields.length > 0) {
            opts.fields = ":("+opts.fields.join()+")";
        }else{
            opts.fields = "";
        }

        if (opts.property) {
            params = "/"+opts.property+opts.fields;
        }else{
            params = opts.fields;
        }

        this.oa.getProtectedResource(
            "http://api.linkedin.com/v1/people/"+opts.user+params+"?format=json",
            "GET",
            this.session.oauth_access_token,
            this.session.oauth_access_token_secret,
            function (err, data) {
                data = JSON.parse(data);

                callback(err, data);
            });
    },

    connections: function (user, callback) {
        if (_.isFunction(user)) {
            callback = user;
            user = "~";
        }

        this.__people({user: user,
                       fields: ["first-name", "last-name", "location", "public-profile-url", "picture-url"],
                       property: "connections"},
                     function (err, data) {
                         callback(err, data.values || []);
                     });
    },

    me: function (callback) {
        this.__people({user: "~",
                       fields: ["id", "first-name", "last-name", "location", "public-profile-url", "picture-url"]},
                      callback);
    }

});
