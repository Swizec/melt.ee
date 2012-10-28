$(function() {

var main_tabs = {
    users : 'Users',
    conferences : 'Conferences',
    attending : 'Attending',
    melts : 'Melts'
};


var TabView = Backbone.View.extend({
    className : 'tab',
    render : function(v) {
        this.$el.html(v);
        return this;
    }
});

var TopView = Backbone.View.extend({
    className : 'top',
    initialize : function() {
        var that = this;
        _.each(main_tabs, function(v,k) {
            var tab = new TabView();
            that.$el.append(tab.render(v).el);
        });
    },
    render : function() {
        return this;
    }
});


var AppView = Backbone.View.extend({
    el : $('#tabs'),
    initialize : function() {
        var tabs = new TopView();
        this.$el.prepend(tabs.render().el);
    }
});

var app = new AppView();

});
