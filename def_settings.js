
exports.port = 80;
exports.base_url = function (req) {
    var host = req.headers.host;
    return "http://"+host;
};

exports.dev_ips = ["127.0.0.1"];
