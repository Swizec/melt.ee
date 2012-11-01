$(function() {
    var cl = console.log;

    Backbone.sync = function(method, model, options) {
        if(method == 'create' && model.url) {
            var tmp = model.toJSON();
            tmp.cid = model.cid;
            $.ajax({ url : model.url,
                     data : tmp,
                     type : 'POST',
                     success : function(resp) {
                        var i = new Instance(resp);
                        Items.add(i);
                     }
            });
        }
        if(method == 'read') {
           $.ajax({ url : model.url,
                    type : 'GET',
                    success : function(resp) {
                        options.success(resp);
                    }
           });
        }
    };

    var main_tabs = {
        linkedin_users : 'Users',
        conferences : 'Conferences',
        attending : 'Attending',
        melts : 'Melts'
    };

    var TabView = Backbone.View.extend({
        className : 'tab',
        render : function(txt, url) {
            this.url = url;
            this.$el.html(txt);
            return this;
        },
        events : { 'click' : 'show_list' },
        show_list : function() {
            Items = new InstanceCollection();
            Items.url = '/api/'+this.url;

            var list = new ListView();
            $('#data').html('');
            $('#data').append(list.render(this.url).el);
            Items.fetch();
            $('.tab').removeClass('tab_active');
            this.$el.addClass('tab_active');
        }
    });

    var TopView = Backbone.View.extend({
        className : 'top',
        initialize : function() {
            var that = this;
            _.each(main_tabs, function(v,k) {
                var tab = new TabView();
                that.$el.append(tab.render(v,k).el);
            });
        },
        render : function() {
            return this;
        }
    });

    var Instance = Backbone.Model;

    var InstanceCollection = Backbone.Collection.extend({
        model : Instance,
        parse : function(data) {
            var that = this;
            _.each(data, function(v,k) {
                v.url = that.url.replace('\/api\/','');
                Items.add(v);
            });
        }
    });

    var Items;

    var ConferenceForm = Backbone.View.extend({
        id : 'form',
        tagName : 'form',
        template : $('#conference_form').html(),
        render : function(model) {
            this.$el.attr('method', 'post');
            this.$el.append(this.template);
            this.$el.find('[name=date]').datepicker({
                    dateFormat: 'd.m.yy',
                    duration: 0,
                    firstDay: 1,
                    altFormat: 'yy-mm-dd'
            });
            return this;
        },
        events : {
            "click .cancel_form" : "cancelForm",
            "click .save_form" : "saveForm"
        },
        cancelForm : function() {
            this.$el.hide();
            $('#data .list_table').show();
            $('#add_item').show();
        },
        saveForm : function() {
            //gather form data
            var date = $('#form [name=date]').datepicker("getDate").format('Y-m-d');
            var x = $('#form [name=time]').val().split(':');
            var h = x[0];
            h = h>9?h:'0'+h;
            var t = x[1]||'00';

            var data = {
                location : $('#form [name=location]').val(),
                date_time : date+'T'+h+':'+t+':00.000',
                description : $('#form [name=description]').val(),
                spots : $('#form [name=spots]').val(),
                active : $('#form [name=active]').attr('checked')?1:0
            };

            $('#data .list_table').show();

            var inst = new Instance(data);
            inst.url = Items.url;
     
            //inst.save();

            this.$el.hide();
            $('#add_item').show();
        }
    });

    var AddButton = Backbone.View.extend({
        id : 'add_item',

        className : 'btn btn-inverse',
        render : function(url) {
            this.url = url;
            this.$el.html('Add');
            return this;
        },
        events : { 'click' : 'editItem' },
        editItem : function() {
            $('#data .list_table').hide();
            this.$el.hide();
            $('#form').remove();
            if(this.url == 'conferences') {
                var form = new ConferenceForm();
                $('#data').prepend(form.render().el);
                $('#form [name=location]').focus();
            }
        }
    });

    var ListView = Backbone.View.extend({
        tagName : 'table',
        className : 'list_table',
        initialize : function() {
            this.url = Items.url.replace('\/api\/','');
            this.$el.append($('<tbody>'));
            Items.on('add', this.onAddItem, this);
        },
        onAddItem : function(model) {
            var row = new UserRowView();
            this.$el.find('tbody').eq(0).append(row.render(model, this.url).el);
        },
        onChange : function() {
            cl('Changed!');
        },
        render : function(url) {
            var head = new HeaderRow();
            this.$el.find('tbody').append(head.render(url).el);
            if(url == 'conferences') {
                var add_button = new AddButton();
                $('#data').prepend(add_button.render(url).el);
            }
            return this;
        }
    });

    var HeaderRow = Backbone.View.extend({
        render : function(url) {
            this.el = $('#'+url+'_header').html();
            return this;
        }
    });

    var UserRowView = Backbone.View.extend({
        tagName : 'tr',
        render : function(model, url) {
            this.model = model;
            var data = model.toJSON();
            var date = new Date(data.creation_timestamp);
            data.creation_timestamp = date.format('j.n. H:i:s');
            if(data.date_time) {
                var x = new Date(data.date_time);
                data.date_time = x.format('j.n. H:i');
            }
            var tmp = Handlebars.compile($('#'+url+'_list_row').html());
            this.$el.html(tmp(data));
            return this;
        },
        events : { 'click .edit_button' : 'editRow' },
        editRow : function() {
            cl(this.model);
        }
    });

    var AppView = Backbone.View.extend({
        initialize : function() {
            // Show tabs
            var tabs = new TopView();
            $('#tabs').prepend(tabs.render().el);

            // Load user list by triggering first tab
            $('#tabs .tab').eq(0).trigger('click');
        }
    });

    var app = new AppView();

});
