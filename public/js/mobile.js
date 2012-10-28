
var AppRouter = Backbone.Router.extend({
    
    routes: {
        "": "events",
        "ready": "ready",
        "waiting/:event": "waiting",
        "handshake/:event": "handshake",
        "melt/:event/:person": "melt",
        "thanks": "thanks"
    },

    events: function () {
        console.log("events");
    },

    ready: function () {
        console.log("ready");
    },

    waiting: function (event) {
        console.log("waiting");
    },

    handshake: function (event) {
        console.log("handshake");
    },

    melt: function (event, person) {
        console.log("melt");
    },

    thanks: function () {
        console.log("thanks");
    }
    
});

(function ($) {

    var app = new AppRouter();

    Backbone.history.start({pushState: true});

    $("a.btn").click(function (event) {
        event.preventDefault();
        app.navigate($(event.target).attr("href"),
                    {trigger: true});
    });

})(jQuery);
