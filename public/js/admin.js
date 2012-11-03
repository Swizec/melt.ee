$(function() {
    var cl = console.log;
    var api_str = '\/api\/';
    var test = '100';

    Backbone.sync = function(method, model, options) {
        if(method == 'create' && model.url) {
            var tmp = model.toJSON();
            tmp.cid = model.cid;
            $.ajax({ url : model.url,
                     data : tmp,
                     type : 'POST',
                     success : function(resp) {
                        console.log(resp);
                        options.success(resp);
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

    //------------------------------------------------------------------------//
    // Model && Collections
    //------------------------------------------------------------------------//
    
    var Instance = Backbone.Model.extend({
        idAttribute: "_id",
        parse : function(data) {
            console.log(data);
            var x = new Instance(data);
            Items.add(x);
        }
    });

//    var Instance = Backbone.Model.extend();

    var InstanceCollection = Backbone.Collection.extend({
        model : Instance,
        parse : function(data) {
            var that = this;
            setTimeout(function() {
                _.each(data, function(json) {
                    var inst = new Instance(json);
                    that.add(inst);
                });
            }, 0);
        }
    });

    var Items = new InstanceCollection;

    var TabsM = Backbone.Model.extend();
    var TabsC = Backbone.Collection.extend({ model : TabsM });
    var Tabs = new TabsC();

    //------------------------------------------------------------------------------------------//
    // Top navigation
    //------------------------------------------------------------------------------------------//

    var TabView = Backbone.View.extend({
        className : 'tab',
        render : function() {
            this.$el.html(this.model.toJSON().txt);
            return this;
        },
        events : { 'click' : 'show_list' },
        show_list : function() {
            Items.reset();
            Items.url = '/api/'+this.model.toJSON().url;

            var list = new ListView({ model : this.model });
            $('#data').html('');
            $('#data').append(list.render().el);
            Items.fetch();
            $('.tab').removeClass('tab_active');
            this.$el.addClass('tab_active');
        }
    });

    var TopView = Backbone.View.extend({
        className : 'top',
        initialize : function() {
            Tabs.bind('add', this.addTab, this);
        },
        render : function() {
            return this;
        },
        addTab : function(tab) {
            var tabV = new TabView({ model : tab });
            this.$el.append(tabV.render().el);
        }
    });


    //------------------------------------------------------------------------------------------//
    // Add button above list
    //------------------------------------------------------------------------------------------//
    var AddButton = Backbone.View.extend({
        id : 'add_item',
        className : 'btn btn-inverse',
        render : function() {
            this.$el.html('Add');
            return this;
        }
    });


    //------------------------------------------------------------------------------------------//
    // FORM
    //------------------------------------------------------------------------------------------//
    var ConferenceForm = Backbone.View.extend({
        id : 'form',
        tagName : 'form',
        template : $('#conference_form').html(),
        events : {
            "click .cancel_form" : "cancelForm",
            "click .save_form" : "saveForm"
        },
        render : function() {
            this.$el.attr('method', 'post');
            this.$el.append(this.template);
            this.$el.find('[name=date]').datepicker({
                    dateFormat: 'd.m.yy',
                    duration: 0,
                    firstDay: 1,
                    altFormat: 'yy-mm-dd'
            });
            var data = this.model.toJSON();
            if(data.date_time) {
                var date = new Date(data.date_time);
                this.$el.find('[name=date]').val(date.format('j.n.Y'));
                this.$el.find('[name=time]').val(date.format('H:i'));
            }
            this.$el.find('[name=location]').val(data.location);
            this.$el.find('[name=description]').val(data.description);
            this.$el.find('[name=spots]').val(data.spots);
            this.$el.find('[name=active]').attr('checked', data.active === true?'checked':false);
            return this;
        },
        cancelForm : function() {
            this.$el.hide();
            $('#data .list_table').show();
            $('#add_item').show();
        },
        saveForm : function() {
            //gather form data
            var date_time = '';
            var date = $('#form [name=date]').datepicker("getDate");
            date = date?date.format('Y-m-d'):'';
            var x = $('#form [name=time]').val().split(':');
            var h = x[0];
            h = h>9?h:'0'+h;
            var t = x[1]||'00';
            if(date) {
                date_time = date+'T'+h+':'+t+':00.000';
            }

            var data = {
                location : $('#form [name=location]').val(),
                date_time : date_time,
                description : $('#form [name=description]').val(),
                spots : $('#form [name=spots]').val(),
                active : $('#form [name=active]').attr('checked')?1:0
            };

            $('#data .list_table').show();

            this.model.set(data);
            this.model.save();
     
            this.$el.hide();
            $('#add_item').show();
        }
    });

    //------------------------------------------------------------------------------------------//
    // LIST
    //------------------------------------------------------------------------------------------//
    var ListView = Backbone.View.extend({
        id : 'list_div',
        className : 'list_table',
        initialize : function() {
            this.url = this.model.toJSON().url;
            this.$el.append($('<table><tbody /></table>'));
            Items.on('add', this.onAddItem, this);
        },
        events : { 'click #add_item' : 'addItem' },
        onAddItem : function(item) {
            var row = new UserRowView({ model : item });
            this.$el.find('tbody').eq(0).append(row.render().el);
        },
        onChange : function() {
            cl('Changed!');
        },
        render : function() {
            var head = new HeaderRow({ model : this.model }); //passing tab model
            this.$el.find('tbody').append(head.render().el);
            if(this.url == 'conferences') {
                var add_button = new AddButton();
                this.$el.prepend(add_button.render().el);
            }
            return this;
        },
        addItem : function() {
            $('#data .list_table').hide();
            $('#add_item').hide();
            $('#form').remove();
            if(this.url == 'conferences') {
                var item = new Instance();
                item.url = api_str+this.url;
                var form = new ConferenceForm({ model : item });
                $('#data').prepend(form.render().el);
                $('#form [name=location]').focus();
            }
        }
    });

    var HeaderRow = Backbone.View.extend({
        render : function() {
            this.el = $('#'+this.model.toJSON().url+'_header').html();
            return this;
        }
    });

    var UserRowView = Backbone.View.extend({
        tagName : 'tr',
        events : { 'click .edit_button' : 'editRow',
                   'click .delete_row' : 'deleteRow' },
        render : function() {
            var furl = this.model.url().split('/')[2];
            var data = this.model.toJSON();
            var date = new Date(data.creation_timestamp);
            data.creation_timestamp = date.format('j.n. H:i:s');
            if(data.date_time) {
                var x = new Date(data.date_time);
                data.date_time = x.format('j.n. H:i');
            }
            var tmp = Handlebars.compile($('#'+furl+'_list_row').html());
            this.$el.html(tmp(data));
            return this;
        },
        editRow : function() {
            $('#data .list_table').hide();
            $('#add_item').hide();
            $('#form').remove();
            var form = new ConferenceForm({ model : this.model });
            $('#data').prepend(form.render().el);
        },
        deleteRow : function() {
            var that = this;
            $.ajax({ url : this.model.url(),
                     type : "DELETE",
                     success : function(res) {
                         that.$el.fadeOut(200, function() {
                            that.$el.remove();
                         });
                     }
            });
        }
    });


    var main_tabs = {
        linkedin_users : 'Users',
        conferences : 'Conferences',
        attending : 'Attending',
        melts : 'Melts'
    };

    //------------------------------------------------------------------------------------------//
    // APP VIEW
    //------------------------------------------------------------------------------------------//
    var AppView = Backbone.View.extend({
        initialize : function() {
            // Show tabs
            var tabs = new TopView();

            $('#logout').click(function() {
                document.location = '/logout';
            });

            _.each(main_tabs, function(v,k) {
                var tab = new TabsM({ url : k, txt : v });
                Tabs.add(tab);
            });

            $('#tabs').prepend(tabs.render().el);

            // Load user list by triggering first tab
            $('#tabs .tab').eq(1).trigger('click');
        }
    });

    var app = new AppView();

//    setInterval(function() {
//        cl(Items);
//    }, 500);

});
