(function() {
    "use strict";

    var path = require('path'),
        fs = require('fs'),
        colors = require('colors'),
        argv = require('optimist').argv,
        http = require('http');

    module.exports = {
        run: function(options) {
            if (!options) {
                options = {
                    interval: 1000,
                    // catchupDelay: 5,
                    watch: (argv.w || '.').split(':'),
                    port: parseInt(argv.p || '9999', 10)
                };
            }
            this.options = options;

            this.createWatcher();
            this.createServer();
        },

        createServer: function() {
            var that = this,
                port;

            this.app = http.createServer(function(req, res) {
                if (req.url !== '/devreload.js') {
                    res.statusCode = 404;
                    return res.end();
                }

                var responseJSBody = function() {
                    res.setHeader('Content-Type', 'text/javascript');
                    res.write(that.jsBody);
                    res.end();
                };

                if (!that.jsBody) {
                    fs.readFile(path.join(__dirname, 'devreload-client.js'), function(err, data) {
                        that.jsBody = data;

                        responseJSBody();

                    });
                } else {
                    responseJSBody();
                }
            });

            this.io = require('socket.io').listen(this.app);

            this.io.sockets.on('connection', function (socket) {
                socket.emit('news', 'welcome to devreload');
            });

            port = this.options.port;
            this.app.listen(port, function() {
                console.log('LOG'.green, "devreload server listening on " + port);
            });
        },

        createWatcher: function() {
            var that = this,
                interval = this.options.interval;

            this.options.watch.forEach(function (watchItem) {
                watchItem = path.resolve(watchItem);
                console.log('LOG'.green, 'Watching "' + watchItem + '"');
                that.findAllWatchFiles(watchItem, function(f) {
                    that.watchGivenFile(f, interval);
                });
            });
        },

        findAllWatchFiles: function(dir, callback) {
            var that = this;
            dir = path.resolve(dir);

            fs.stat(dir, function(err, stats){

                if (err) {
                    console.error('ERR'.red, 'Error retrieving stats for file: ' + dir);
                } else {
                    if (stats.isDirectory()) {
                        fs.readdir(dir, function(err, fileNames) {
                            if(err) {
                                console.error('Error reading path: ' + dir);
                            } else {
                                fileNames.forEach(function (fileName) {
                                    that.findAllWatchFiles(path.join(dir, fileName), callback);
                                });
                            }
                        });
                    } else {
                        callback(dir);
                    }
                }
            });
        },

        watchGivenFile: function(watch, poll_interval) {
            var that = this;
            fs.watchFile(watch, { persistent: true, interval: poll_interval }, function() {
                console.log('LOG'.green, 'Changed', watch);
                that.io.sockets.emit('reload', 'changed');
            });

            // console.log('LOG'.green, 'Watching file "' + watch + '"');
        }
    };

})();
