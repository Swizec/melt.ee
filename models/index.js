// User model

var people_schema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    linkedin_id: String,
    publicUrl: String
});

var users_schema = new mongoose.Schema({
    linkedin_id : String,
    firstName : String,
    lastName : String,
    headline : String,
    email : String,
    pictureUrl : String,
    publicUrl : String,
    creation_timestamp : { 'type': Date, 'default': Date.now },
    topic1 : {type: String, default: ''},
    topic2 : {type: String, default: ''},
    topic3 : {type: String, default: ''},
    is_admin : { 'type' : Boolean, 'default' : 0 },
    connections: [people_schema]
});

var conference_schema = new mongoose.Schema({
    location : String,
    date_time : { 'type' : Date },
    description : String,
    spots : String,
    active : Boolean
});

var melter_schema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    topics: [{type: String, default: ""}],
    handshake_time: {type: Date, default: null},
    handshaked: {type: Boolean, default: false},
    melted: {type: Boolean, default: false}
});

var melt_schema = new mongoose.Schema({
    users: [melter_schema],
    creation_time: {type: Date, default: Date.now},
    finish_time: {type: Date, default: null},
    spot: Number,
    finished: {type: Boolean, default: false}
    
});


db.once('open', function() {
    exports.linkedin_users = db.model('linkedin_users', users_schema);
    exports.conferences = db.model('conferences', conference_schema);
    exports.melts = db.model('melts', melt_schema);
    
    exports.schemas = {
        user: users_schema,
        conference: conference_schema,
        people: people_schema,
        melt: melt_schema
    };
});
