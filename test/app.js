var devreload = require('../lib/devreload.js');

var http = require('http');

var s = http.createServer(function(req, res) {
    res.end('xxxxxxx\n');
});

devreload.listen(s);

s.listen(3000);