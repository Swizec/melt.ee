
(function ($) {

    var Router = Backbone.Router.extend({
        
        routes: {
            "mobile": "events",
            "mobile/topics": "topics",
            "mobile/ready/:event_id": "ready",
            "mobile/waiting/:event_id": "waiting",
            "mobile/handshake/:event_id": "handshake",
            "mobile/melt/:event_id/:person": "melt",
            "mobile/thanks": "thanks"
        }
    });

    var PageView = Backbone.View.extend({
        
        events: {
            "click a.btn": "__navigate"
        },

        render: function () {
            this.$el.html(this.template(this.options));
            return this.$el;
        },

        __navigate: function (event, href) {
            event.preventDefault();

            if (!href) {
                href = $(event.target).attr("href");
            }
            
            this.options.router.navigate('mobile'+href,
                                         {trigger: true});
        }

    });

    var EventsView = PageView.extend({
        template: Handlebars.compile($("#template-events").html()),

        events: {
            "click a.btn": "navigate"
        },

        navigate: function (event) {
            var chosen = $(event.target).siblings("select").val();
            this.__navigate(event, '/ready/'+chosen);
        }
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
                                       function (event_id, person_id) {
                                           this.render(route, arguments);
                                       }, this);
            }, this);
        },

        render: function (route, ids) {
            var view = new this.pages[route]({el: this.$el,
                                              router: this.options.router,
                                              event_id: ids[0],
                                              person_id: ids[1]});

            view.render();
        }

    });

    var router = new Router(),
        view = new View({router: router,
                         el: $("div#view")});

    Backbone.history.start({pushState: true});

})(jQuery);
