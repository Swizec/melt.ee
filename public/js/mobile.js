
var Router = Backbone.Router.extend({
    
    routes: {
        "": "events",
        "ready/:event": "ready",
        "waiting/:event": "waiting",
        "handshake/:event": "handshake",
        "melt/:event/:person": "melt",
        "thanks": "thanks"
    }
});

var PageView = Backbone.View.extend({
    
    events: {
        "a.btn": "navigate"
    },

    render: function () {
        return this.template();
    },

    navigate: function (event) {
        event.preventDefault();
        alert("BU");
        this.options.router.navigate($(event.target).attr("href"),
                                     {trigger: true});
    }

});

var EventsView = PageView.extend({
    template: Handlebars.compile($("#template-events").html()),

});

var ReadyView = PageView.extend({
    template: Handlebars.compile($("#template-ready").html())
});

var WaitingView = PageView.extend({
    template: Handlebars.compile($("#template-waiting").html())
});

var HandshakeView = PageView.extend({
    template: Handlebars.compile($("#template-handshake").html())
});

var MeltView = PageView.extend({
    template: Handlebars.compile($("#template-melt").html())
});

var ThanksView = PageView.extend({
    template: Handlebars.compile($("#template-thanks").html())
});


var View = Backbone.View.extend({

    pages: {"events": EventsView,
            "ready": ReadyView,
            "waiting": WaitingView,
            "handshake": HandshakeView, 
            "melt": MeltView,
            "thanks": ThanksView
    },

    initialize: function () {
        _.keys(this.pages).map(function (route) {
            this.options.router.on("route:"+route,
                                   function () {
                                       this.render(route);
                                   }, this);
        }, this);
    },

    render: function (route) {
        var view = new this.pages[route]();
        this.$el.html(view.render());
    }

});

(function ($) {

    var router = new Router(),
        view = new View({router: router,
                         el: $("div#view")});

    Backbone.history.start({pushState: true});

})(jQuery);
