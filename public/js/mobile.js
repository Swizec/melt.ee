
var Router = Backbone.Router.extend({
    
    routes: {
        "": "events",
        "ready": "ready",
        "waiting/:event": "waiting",
        "handshake/:event": "handshake",
        "melt/:event/:person": "melt",
        "thanks": "thanks"
    }
});

var View = Backbone.View.extend({

    pages: ["events", "ready", "waiting", "handshake", "melt", "thanks"],

    templates: {},

    initialize: function () {
        this.pages.map(function (route) {
            this.options.router.on("route:"+route,
                                   function () {
                                       this.render(route);
                                   }, this);
        }, this);

        this.templates = _.object(this.pages,
                                  this.pages.map(function (page) {
                                      return Handlebars.compile($("#template-"+page).html());
                                  }));
    },

    render: function (route) {
        this.$el.html(this.templates[route]());
    }

});

(function ($) {

    var router = new Router(),
        view = new View({router: router,
                         el: $("div#view")});

    Backbone.history.start({pushState: true});

    $("a.btn").click(function (event) {
        event.preventDefault();
        router.navigate($(event.target).attr("href"),
                        {trigger: true});
    });

})(jQuery);
