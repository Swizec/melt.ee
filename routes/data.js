
var  _ = require('underscore')._,
    step = require('step'),
    mongoose = require('mongoose'),
    db = mongoose.createConnection('localhost', 'meltee');

// Save topics
exports.save_topics = function(req, res) {
    step(
    function() {
        if(User && req.session) {
            User.find({ linkedin_id : req.session.user_sess.id }, this);
        } else {
            return false;
        }
    },
    function(err, result) {
        var post_data = req.body;
        User.update({ linkedin_id : result[0].linkedin_id },
                    { '$set' : { topic1 : post_data.topic1,
                                 topic2 : post_data.topic2,
                                 topic3 : post_data.topic3 }
                    }, this);
    },

    function(err, result) {
        res.writeHeader(200, { "Content-type" : "text/html; charset=utf-8" });
        res.end('Saved.', 'UTF-8');
    }
    
    );
};


// Load topics
exports.topics = function(req, res) {
    if(User && req.session.user_sess) {
        step(
        function() {
            User.find({ linkedin_id : req.session.user_sess.id }, this);
        },
        function(err, result) {
            var topics = {};
            if(_.size(result)) {
                topics = { topic1 : result[0].topic1 || '', topic2 : result[0].topic2 || '', topic3 : result[0].topic3 || '' };
            }
            console.log(topics);
            res.writeHeader(200, { "Content-type" : "application/json; charset=utf-8" });
            res.write('var topics = '+JSON.stringify(topics)+';', 'UTF-8');
            res.end();
        }
        );
    } else {
        console.log('NO User or session?!');
        res.writeHeader(200, { "Content-type" : "application/json; charset=utf-8" });
        res.write('var topics = {};', 'UTF-8');
        res.end();
    }
};

