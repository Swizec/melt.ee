//================================//
// CRUD
//================================//
exports.create = function(req, res) {

};

exports.read = function(req, res) {
    if(!req.session.user_sess) {
        res.send('No session...');
        return false;
    }
    var collection = req.params.collection;
    var schema = new mongoose.Schema();
    var API = db.model(collection, schema);
    API.find({}, function(err, result) {
        res.send(result);
    });
};

exports.update = function(req, res) {
};

exports.delete = function(req, res) {
    
};