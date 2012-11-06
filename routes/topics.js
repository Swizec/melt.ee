exports.topics = function(req, res) {
    if(!req.session.user_sess) {
        res.redirect('/');
    } else {
        res.render('topics.jade', req.session.user_sess);
    }
};

// Save topics
exports.save_topics = function(req, res) {
    step(
    function() {
        if(req.session) {
            models.linkedin_users.find({ linkedin_id : req.session.user_sess.id }, this);
        } else {
            return false;
        }
    },
    function(err, result) {
        var post_data = req.body;
        models.linkedin_users.update({ linkedin_id : result[0].linkedin_id },
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
exports.load_topics = function(req, res) {
    if(req.session.user_sess) {
        step(
        function() {
            models.linkedin_users.find({ linkedin_id : req.session.user_sess.id }, this);
        },
        function(err, result) {
            var topics = {};
            if(_.size(result)) {
                topics = { topic1 : result[0].topic1 || '', topic2 : result[0].topic2 || '', topic3 : result[0].topic3 || '' };
            }
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