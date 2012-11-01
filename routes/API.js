//================================//
// CRUD
//================================//

// TODO!!! tomorrow, replace all 4 with module.exports (otherwise we have to look for user session in every func below
// before accessing db)

exports.create = function(req, res) {
    // different models (see /models/index.js)
    var prepare = models[req.params.collection](req.body);
    prepare.save(function(err, result) {
        res.send(result);
    });
    
    res.send(req.body);
};

exports.read = function(req, res) {
    if(!req.session.user_sess) {
        res.send('No session...');
        return false;
    }
    var collection = req.params.collection;
    var schema = new mongoose.Schema();
    var API = db.model(collection, schema);
    API.find({}).sort({'creation_timestamp' : -1}).execFind(function(err, result) {
        res.send(result);
    });
};

exports.update = function(req, res) {
};

exports['delete'] = function(req, res) {
    
};

var my_data = function (user_id, callback) {
    var API = db.model('linkedin_users', new mongoose.Schema());
    API.find({linkedin_id: user_id}).execFind(callback);
};

exports.me = function (req, res) {
    var user = req.session.user_sess.id;

    my_data(user, function (err, result) {
        res.send(result);
    });              
};

exports.my_topics = function (req, res) {
    var user = req.session.user_sess.id;

    my_data(user, function (err, result) {
        result = result[0];

        res.send([result.topic1, result.topic2, result.topic3]);
    });
};
