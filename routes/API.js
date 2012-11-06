//================================//
// CRUD
//================================//
var ObjectId = mongoose.Types.ObjectId;
var cl = console.log;

exports.create = function(req, res) {
    // we have different models for each tab (see /models/index.js)
    var prepare = models[req.params.collection](req.body);
    prepare.save(function(err, result) {
        res.send(result);
    });
};

exports.read = function(req, res) {
    var collection = req.params.collection;
    var schema = new mongoose.Schema();
    var API = db.model(collection, schema);
    API.find({}).sort({'creation_timestamp' : -1}).execFind(function(err, result) {
        res.send(result);
    });
};

exports.update = function(req, res) {
    var collection = req.params.collection;
    delete req.body._id;
    delete req.body.__v;
    models[req.params.collection].update({ _id : req.params.id }, req.body, function(err, numberAffected, raw) {
        if(err) {
            console.log(err);
        }
        res.send({ ok : 1 });
    });
};

exports.delete = function(req, res) {
    var prepare = models[req.params.collection];
    console.log(req.params.id);
    prepare.remove({ '_id' : new ObjectId(req.params.id) }, function() {
        res.send({ ok : 1 });
    });
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

        res.send([{topic: result.topic1, id: 1},
                  {topic: result.topic2, id: 2},
                  {topic: result.topic3, id: 3}]);
    });
};

exports.save_my_topic = function (req, res) {
    var user = req.session.user_sess.id;

    // TODO: make sure posted topic is sane

    my_data(user, function (err, result) {
        user = result[0];

        user['topic'+req.params.id] = req.body.topic;

        user.save(function () {
            res.send({});
        });
    });
};
