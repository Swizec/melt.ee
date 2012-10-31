
var Router = Backbone.Router.extend({
    
    routes: {
        "": "events",
        "topics": "topics",
        "ready/:event": "ready",
        "waiting/:event": "waiting",
        "handshake/:event": "handshake",
        "melt/:event/:person": "melt",
        "thanks": "thanks"
    }
});

var PageView = Backbone.View.extend({
    
    events: {
        "click a.btn": "navigate"
    },

    render: function () {
        this.$el.html(this.template());
        return this.$el;
    },

    navigate: function (event) {
        event.preventDefault();
        this.options.router.navigate($(event.target).attr("href"),
                                     {trigger: true});
    }

});

var EventsView = PageView.extend({
    template: Handlebars.compile($("#template-events").html())

});

var TopicsView = PageView.extend({
    template: Handlebars.compile($("#template-topics").html())

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
            "topics": TopicsView,
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
        var view = new this.pages[route]({el: this.$el,
                                          router: this.options.router});
        view.render();
    }

});

(function ($) {

    var router = new Router(),
        view = new View({router: router,
                         el: $("div#view")});

    Backbone.history.start({pushState: true});

})(jQuery);
