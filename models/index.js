// User model
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
    is_admin : { 'type' : Boolean, 'default' : 0 }
});
db.once('open', function() {
    exports.User = db.model('linkedin_users', users_schema);
});
