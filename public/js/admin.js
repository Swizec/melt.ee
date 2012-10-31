$(function() {

var cl = console.log;

var main_tabs = {
    users : { url : 'linkedin_users', txt : 'Users' },
    conferences : { url : 'conferences', txt : 'Conferences' },
    attending : { url : 'attending', txt : 'Attending' },
    melts : { url : 'melts', txt : 'Melts' }
};

var TabView = Backbone.View.extend({
    className : 'tab',
    render : function(v) {
        this.$el.html(v.txt);
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

var Instance = Backbone.Model.extend({

});


var InstanceCollection = Backbone.Collection.extend({
    model : Instance,
    parse : function(data) {
        cl(this.url);
        
        _.each(data, function(v,k) {
            //cl(v);
            Items.add(v);
        });
    }
});

var Items;

var ListView = Backbone.View.extend({
    tagName : 'table',
    className : 'list',
    initialize : function() {
        Items.on('add', this.onAddItem, this);
    },
    onAddItem : function(model) {
        var row = new UserRowView();
        cl(model.toJSON());
        this.$el.append(row.render(model).el);
        //var row = new
        //$('#list').append(cl(model.toJSON());
    },
    render : function() {
        return this;
    }
});

var UserRowView = Backbone.View.extend({
    template : _.template($('#users_list_row').html()),
    render : function(model) {
        this.$el.html(this.template(model));
        return this;
    }
});

var AppView = Backbone.View.extend({
    initialize : function() {
        var tabs = new TopView();
        $('#tabs').prepend(tabs.render().el);
        
        Items = new InstanceCollection();
        Items.url = '/api/linkedin_users';

        var list = new ListView();
        $('#data').append(list.render().el);
        Items.fetch();
    }
});

var app = new AppView();

});
