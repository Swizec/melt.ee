
var users_schema;
var empty_schema;
var User;
var cl = console.log;

//------------------------------------------------------------------------------------------------------//
// Mongoose ORM
//------------------------------------------------------------------------------------------------------//
db.once('open', function() {
    users_schema = new mongoose.Schema({
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
        is_admin : { 'type' : Boolean, 'default' : 0 }
    });
    empty_schema = new mongoose.Schema();
    User = db.model('linkedin_users', users_schema);
});

var g_user_info, g_connections;
