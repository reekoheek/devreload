(function() {
    "use strict";

    var path = require('path'),
        fs = require('fs'),
        colors = require('colors'),
        http = require('http');

    var p = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json'), {encoding: 'utf8'}));

    module.exports = {
        version: p.version,
        description: p.description,
        listen: function(server, options) {
            if (! (server instanceof http.Server)) {
                options = server;
                server = null;
            }

            options = options || {};

            this.app = server;
            this.options = {
                interval: 1000,
                watch: ['.'],
                port: 9999,
                loglevel: 2
            };

            for (var i in options) {
                if (options.hasOwnProperty(i)) {
                    if (i == 'interval' && i == 'port' && i == 'loglevel') {
                        options[i] = parseInt(options[i] + '', 10);
                    }
                    this.options[i] = options[i];
                }
            }
            if(this.options.watch === null || this.options.watch === false){
                if(this.options.loglevel >= 2) // above INFO level
                    console.log('LOG'.green, 'devreload set to not watch files');
            } else {
                this.createWatcher();
            }
            this.createServer();
        },
        reload: function() {
            if(!this.options.quiet)
                    if(this.options.loglevel >= 2) // above INFO level
                        console.log('LOG'.green, 'reload called by external process');
            this.io.sockets.emit('reload', 'changed');
        },

        createServer: function() {
            var that = this,
                port,
                listener = function(req, res) {
                    if (req.url !== '/devreload.js') {
                        if (that.anotherListeners && that.anotherListeners.length >= 1) {
                            for(var i in that.anotherListeners) {
                                that.anotherListeners[i](req, res);
                            }
                        } else {
                            res.statusCode = 404;
                            res.end();
                        }
                        return;
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
                };

            if (!this.app) {
                this.app = http.createServer(listener);
            } else {
                this.anotherListeners = this.app.listeners('request').splice(0);
                this.app.removeAllListeners('request');

                this.app.on('request', listener);
            }

            if (that.options.loglevel >= 3) {
                this.io = require('socket.io').listen(this.app);
            } else {
                this.io = require('socket.io').listen(this.app, {log: false});
            }

            // Use the same log level
            this.io.set('log level', this.options.loglevel);

            this.io.sockets.on('connection', function (socket) {
                socket.emit('news', 'welcome to devreload');
            });

            port = this.options.port;
            this.app.listen(port, function() {
                if(that.options.loglevel >= 2) // above INFO level
                    console.log('LOG'.green, "devreload server listening on " + port);
            });
        },

        createWatcher: function() {
            var that = this,
                interval = this.options.interval;

            this.options.watch.forEach(function (watchItem) {
                watchItem = path.resolve(watchItem);
                if(that.options.loglevel >= 2) // above INFO level
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
                    if(that.options.loglevel >= 0) // above ERROR level
                        console.error('ERR'.red, 'Error retrieving stats for file: ' + dir);
                } else {
                    if (stats.isDirectory()) {
                        fs.readdir(dir, function(err, fileNames) {
                            if(err) {
                                if(that.options.loglevel >= 0) // above ERROR level
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
                if(!that.options.quiet)
                    if(that.options.loglevel >= 2) // above INFO level
                        console.log('LOG'.green, 'Changed', watch);
                that.io.sockets.emit('reload', 'changed');
            });

            // console.log('LOG'.green, 'Watching file "' + watch + '"');
        }
    };

})();
