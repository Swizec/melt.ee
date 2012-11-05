
var Topic = Backbone.Model.extend({});
var Event = Backbone.Model.extend({});

var Topics = Backbone.Collection.extend({
    model: Topic,
    
    url: '/api/my_topics',

    save: function () {
        this.models.map(function (item) {
            if (item.get("changed")) {
                item.save({},
                         {success: function () {item.trigger("saved");},
                          error: function () {item.trigger("error");}});
            }
        });
    }
});

var Events = Backbone.Collection.extend({
    model: Event,
    url: '/api/conferences'
});

(function ($) {

    var Router = Backbone.Router.extend({
        
        routes: {
            "mobile": "events",
            "mobile/topics": "topics",
            "mobile/ready/:event_id": "ready",
            "mobile/waiting/:event_id": "waiting",
            "mobile/waiting/:event_id/:person": "waiting",
            "mobile/handshake/:event_id/:person": "handshake",
            "mobile/melt/:event_id/:person": "melt",
            "mobile/thanks": "thanks"
        }
    });

    var PageView = Backbone.View.extend({
        
        events: {
            "click a.btn": "__navigate"
        },

        render: function () {
            return this.__render();
        },

        __render: function () {
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
            "click a.btn.topics": "__navigate",
            "click a.btn.go": "navigate"
        },

        initialize: function () {
            var events = this.Events = new Events();
            events.fetch();
            events.on("reset", this.redraw_events, this);
        },

        navigate: function (event) {
            var chosen = this.$el.find("select:visible").val();
            this.__navigate(event, '/ready/'+chosen);
        },

        redraw_events: function () {
            var template = Handlebars.compile($("#template-events-list").html()),
                $select = this.$el.find("select:visible").html("");

            this.Events.map(function (item) {
                $select.append(template(item.toJSON()));
            });
        }
    });

    var TopicsView = PageView.extend({
        template: Handlebars.compile($("#template-topics").html()),

        events: {
            "submit form": "save"
        },

        subviews: [],

        initialize: function () {
            var topics = this.topics = new Topics();
            topics.fetch();
            topics.on("reset", this.redraw, this);
        },

        save: function (event) {
            event.preventDefault();
            this.topics.save();

            if (this.options.first_time) {
                this.$el.find("a.continue").show();
                this.$el.find("button.first").removeClass("btn-primary").removeClass("btn-large");
            }
        },

        redraw: function () {
            if (this.topics.all(function (topic) { return topic.get("topic") == ""; })) {
                this.options.first_time = true;
                this.render();
            }

            this.fill_topics();
        },

        fill_topics: function () {
            var $inputs = this.$el.find("input"),
                i = 0;
            
            this.topics.map(function (topic) {
                var view = new TopicInputView({el: $($inputs[i++]),
                                               model: topic});
                view.render();
                this.subviews.push(view);
            }, this);
        }

    });

    var TopicInputView = Backbone.View.extend({
        events: {
            "change": "update"
        },

        initialize: function () {
            this.model.on("change", this.render, this);
            this.model.on("error", this.error, this);
            this.model.on("saved", this.success, this);
        },

        render: function () {
            this.$el.val(this.model.get("topic"));
        },

        update: function () {
            this.clean();
            this.model.set("topic", this.$el.val());
            this.model.set("changed", true);
        },

        error: function () {
            this.clean();
            this.$el.parent().addClass("error");
        },

        success: function () {
            this.clean();
            this.$el.parent().addClass("success");
        },

        clean: function () {
            this.$el.parent().removeClass("success").removeClass("error");
        }
    });

    var ReadyView = PageView.extend({
        template: Handlebars.compile($("#template-ready").html())
    });

    var WaitingView = PageView.extend({
        template: Handlebars.compile($("#template-waiting").html()),

        render: function () {
            this.$el.html(this.template({in_melt: !!this.options.person_id}));

            this.$el.find("a.btn").attr("href", "/ready/"+this.options.event_id);

            return this.$el;
        }
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
//ackbone.history.start({pushState: true, root: "/public/search/"})

})(jQuery);

//For iPhone and Andriod To remove Address bar when viewing website on Safari Mobile
// When ready...
window.addEventListener("load",function() {
  // Set a timeout...
  setTimeout(function(){
   // Hide the address bar!
    window.scrollTo(0, 1);
   }, 0);
});

