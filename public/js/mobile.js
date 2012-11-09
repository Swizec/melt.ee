
var Topic = Backbone.Model.extend({});
var Event = Backbone.Model.extend({
    url: function () {
        return '/api/conferences/'+this.attributes._id;
    }
});
var ReadyUsers = Backbone.Model.extend({
    url: '/api/ready_users'
});
var Me = Backbone.Model.extend({
    url: '/api/me'
});
var Melt = Backbone.Model.extend({});

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
            "": "events",
            "events": "events",
            "topics/*back": "topics",
            "ready/:event_id": "ready",
            "waiting/:event_id": "waiting",
            "waiting/:event_id/:melt": "waiting",
            "handshake/:event_id/:melt": "handshake",
            "melt/:event_id/:person": "melt",
            "thanks": "thanks"
        }
    });

    var PageView = Backbone.View.extend({

        events: {
            "click a.btn": "__navigate"
        },

        socket: io.connect(), // creates socket all views will have access to
        melt: new Melt(),

        render: function () {
            return this.__render();
        },

        __render: function () {
            this.$el.html(this.template(this.options));
            return this.$el;
        },

        __navigate: function (event, href) {
            if (event) event.preventDefault();
            //event.stopImmediatePropagation();

            if (!href) {
                href = $(event.target).attr("href");
            }
            
            this.options.router.navigate(href,
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
            event.stopImmediatePropagation();

            var chosen = this.$el.find("select:visible").val();
            this.options.router.chosenEvent = this.Events.where({_id: chosen})[0];

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
            "submit form": "save",
            "click a.btn": "__navigate"
        },

        subviews: [],

        initialize: function () {
            var topics = this.topics = new Topics();
            topics.fetch();
            topics.on("reset", this.redraw, this);

            // needed because of generality of PageView and routing
            this.options.back_url = this.options.event_id;
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
        template: Handlebars.compile($("#template-ready").html()),
        meta_template: Handlebars.compile($("#template-ready-meta").html()),

        initialize: function () {
            this.model = new ReadyUsers();
            this.model.on("change", this.number, this);
        },

        render: function () {
            this.model.fetch();
            this.__render();

            this.render_meta("~");
        },

        render_meta: function (count) {
            this.$el.find(".meta").html(
                this.meta_template({count: count,
                                    event: this.options.router.chosenEvent.get("location")}));
        },

        number: function () {
            this.render_meta(this.model.get("count"));
        }
    });

    var WaitingView = PageView.extend({
        template: Handlebars.compile($("#template-waiting").html()),

        events: {
            "click a.btn.changed_mind": "change_mind"
        },

        initialize: function () {
            var _this = this;

            this.socket.on("melt", function (melt, me_index) {
                console.log(me_index, melt);

                _.keys(melt).map(function (key) {
                    _this.melt.set(key, melt[key]);
                });
                _this.melt.set("me_index", me_index);
                _this.__navigate(null, 
                                 "/handshake/"+_this.options.event_id+"/"+_this.melt.get("_id"));
            });
        },

        render: function () {
            this.start_ready();
            return this.__render();
        },

        start_ready: function () {
            var me = this.options.me;
            
            this.socket.emit("ready", {_id: me.get("_id")}, function () {
                console.log("server knows we're ready");
            });
        },

        change_mind: function (event) {
            event.stopImmediatePropagation();

            this.socket.emit("not ready", function () {
                console.log("server knows we aren't ready");
            });
            
            this.__navigate(event);
        }
    });

    var HandshakeView = PageView.extend({
        template: Handlebars.compile($("#template-handshake").html()),

        render: function () {
            var melt = this.melt,
                other = this.melt.get("users")[(this.melt.get("me_index")+1)%2];

            this.$el.html(this.template({_id: melt.get("_id"),
                                         spot: melt.get("spot"),
                                         other: other,
                                         event_id: this.options.event_id}));
        }
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
            // this needs to be solved more cleanly
            if (!this.options.router.chosenEvent && ids[0]) {
                var chosen = this.options.router.chosenEvent = new Event({_id: ids[0]});
                chosen.fetch();
            }

            var view = new this.pages[route]({el: this.$el,
                                              router: this.options.router,
                                              event_id: ids[0],
                                              person_id: ids[1],
                                              me: this.options.me});

            view.render();
        }

    });

    var router = new Router(),
        me = new Me(),
        view = new View({router: router,
                         el: $("div#view"),
                         me: me});
    me.fetch();
    
    Backbone.history.start({pushState: true, root: "/mobile/"});

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

