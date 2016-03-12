"use strict";

var app = {
    router       : null,
    persons      : null,
    currentPerson: null,
    pager        : null,
    AppView      : null,
    Router       : null,
    Views        : {},
    Models       : {},
    Collections  : {}
};

app.Views.Side = Backbone.View.extend({
    el: '#side',

    initialize: function () {
        this.template = Handlebars.compile(document.getElementById('tpl-side').innerHTML);
        this.listenTo(app.currentPerson, 'change', this.render);
    },

    render: function () {
        this.el.innerHTML = this.template(app.currentPerson.toJSON());
    }
});

app.Views.Content = Backbone.View.extend({
    el: '#content',

    initialize: function () {
        this.template = Handlebars.compile(document.getElementById('tpl-content').innerHTML);
        this.listenTo(app.currentPerson, 'change', this.render);
    },

    render: function () {
        this.el.innerHTML = this.template(app.currentPerson.toJSON());
    }
});

app.Views.Item = Backbone.View.extend({
    tagName: 'li',

    events: {
        'click a': 'change'
    },

    initialize: function () {
        this.template = Handlebars.compile(document.getElementById('tpl-item').innerHTML);
        this.listenTo(this.model, 'change', this.render);
    },

    change: function (e) {
        e.preventDefault();
        app.router.navigate('!/' + this.model.get('id'), {trigger: true, replace: false});
    },

    render: function () {
        this.el.innerHTML = this.template(this.model.toJSON());
        if (this.model.get('selected')) {
            this.el.classList.add('selected');
        } else {
            this.el.classList.remove('selected');
        }
        return this;
    }
});

app.Views.Pager = Backbone.View.extend({
    el: '#pager',

    events: {
        'click a': 'change'
    },

    initialize: function () {
        this.template = Handlebars.compile(document.getElementById('tpl-pager').innerHTML);
        this.listenTo(app.currentPerson, 'change', this.render);
    },

    change: function (e) {
        e.preventDefault();
        var id = e.target.dataset.id;
        app.router.navigate('!/' + id, {trigger: true, replace: false});
    },

    render: function () {
        this.el.innerHTML = this.template(app.pager.toJSON());
    }
});


app.Models.Person = Backbone.Model.extend({
    defaults: {
        first_name: 'no name',
        last_name : '',
        age       : '',
        location  : '',
        selected  : false,
        id        : 0
    }
});

app.Models.Pager = Backbone.Model.extend({
    defaults: {
        previousId: 0,
        currentId : 0,
        nextId    : 0
    }
});

app.Collections.Persons = Backbone.Collection.extend({
    model: app.Models.Person,
    url  : '/design/js/data.json'
});

app.AppView = Backbone.View.extend({
    initialize: function () {
        app.pager = new app.Models.Pager();
        app.currentPerson = new app.Models.Person();

        new app.Views.Side();
        new app.Views.Content();
        new app.Views.Pager();

        app.persons = new app.Collections.Persons();

        this.listenTo(app.persons, 'add', this.addPerson);
        this.listenTo(app.persons, 'reset', this.addList());

        app.persons.fetch({
            success: function () {
                app.router = new app.Router();
                Backbone.history.start();
            }
        });
    },

    addPerson: function (person) {
        var view = new app.Views.Item({model: person});
        document.getElementById('items').appendChild(view.render().el);
    },

    addList: function () {
        document.getElementById('items').innerHTML = '';
        app.persons.each(this.addPerson, this);
    }
});

app.Router = Backbone.Router.extend({
    routes: {
        ""     : "start",
        "!/:id": "open"
    },

    start: function () {
        app.router.navigate('!/2', {trigger: true, replace: true});
    },

    open: function (id) {
        id = parseInt(id);
        if (isNaN(id)) {
            this.start();
            return this;
        }
        if (id < 0 || id > app.persons.length) {
            this.start();
            return this;
        }
        console.log('route: #!/' + id);

        if (app.currentPerson) {
            var _id = app.currentPerson.get('id');
            if (_id > 0) {
                app.persons.get(_id).set('selected', false);
            }
        }

        var prev = 0, next = 0;
        app.persons.each(function (v, k, l) {
            if (v.id == id) {
                if (k > 0) {
                    prev = l[k - 1].id;
                }
                if (k < l.length - 1) {
                    next = l[k + 1].id;
                }
            }
        });
        app.pager.set({
            previousId: prev,
            currentId : id,
            nextId    : next
        });

        //console.log('currentPerson: ', app.persons.get(id).attributes);
        app.currentPerson.set(app.persons.get(id).attributes);
        app.persons.get(id).set('selected', true);
    }
});

$(function () {

    new app.AppView();

});
