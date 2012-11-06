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
    pictureUrl : String,
    publicUrl : String,
    creation_timestamp : { 'type': Date, 'default': Date.now },
    topic1 : String,
    topic2 : String,
    topic3 : String,
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

db.once('open', function() {
    exports.linkedin_users = db.model('linkedin_users', users_schema);
    exports.conferences = db.model('conferences', conference_schema);
    
    exports.schemas = {
        user: users_schema,
        conference: conference_schema,
        people: people_schema
    };
});
