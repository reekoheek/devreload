var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    http = require('http'),
    m = require('methodder');

var p = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json'), {encoding: 'utf8'}));

module.exports = (function() {
    function devreload(server, options){
        this.version = p.version;
        this.description = p.description;
        
        // Bind instance functions
        this.createServer = m(this.createServer, this);
        this.createWatcher = m(this.createWatcher, this);
        this.middleware = m(this.middleware, this);
        this.watchGivenFile = m(this.watchGivenFile, this);
        this.findAllWatchFiles = m(this.findAllWatchFiles, this);
        this.reload = m(this.reload, this);

        // Adjust if server was not provided
        if(typeof options === 'undefined') {
            this.options = server;
        } else {
            // check if server is of type
            if(!(server instanceof http.Server)){
                // server is wrong type
                var hint;
                if(typeof server.use === 'function'){
                    // probably connect
                    hint = "Looks like you tried to use a Connect app, devreload requires the \"http.Server\" returned from \"app.listen()\"";
                } else {
                    hint = "Devreload requires an http.Server object when initiallized: \"new devreload(options,server);\" or it will create it's own server";
                }
                throw("devreload: Server needs to be http.Server type!\n"+hint);
            }
        }

        // Initiallize
        options = options || {};
        
        // app might be undefined
        this.app = server;

        this.options = {
            interval: 1000,
            watch: ['.'],
            port: 9999,
            loglevel: 2
        };

        // Set options
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                if (key === 'interval' || key === 'port' || key === 'loglevel') {
                    options[key] = parseInt(options[key] + '', 10);
                }
                this.options[key] = options[key];
            }
        }

        // Initiallize watcher if needed
        if(this.options.watch === null || this.options.watch === false){
            if(this.options.loglevel >= 2) // above INFO level
                console.log('LOG'.green, 'devreload set to not watch files');
        } else {
            this.createWatcher();
        }

        // Initiallize server
        this.createServer();
    };
    devreload.listen = function(server, options) {
        //deprecated
        return new devreload(server, options);
    };

    devreload.prototype.reload = function() {
        if(!this.options.quiet)
                if(this.options.loglevel >= 2) // above INFO level
                    console.log('LOG'.green, 'reload called by external process');
        this.io.sockets.emit('reload', 'changed');
    };

    // Middleware can be used in connect servers and httpServers
    devreload.prototype.middleware = function(req, res) {
        var that = this;
        if (req.url !== '/devreload.js') {
            if(this.app instanceof http.Server) {
                if (that.anotherListeners && that.anotherListeners.length >= 1) {
                    for(var i in that.anotherListeners) {
                        that.anotherListeners[i](req, res);
                    }
                } else {
                    res.statusCode = 404;
                    res.end();
                }
            }
            return;
        }
        var responseJSBody = function() {
            res.setHeader('Content-Type', 'text/javascript');
            res.write(that.jsBody);
            res.end();
        };

        // Cache client script and serve
        if (!that.jsBody) {
            fs.readFile(path.join(__dirname, 'devreload-client.js'), function(err, data) {
                that.jsBody = data;

                responseJSBody();
            });
        } else {
            responseJSBody();
        }
    };
    devreload.prototype.createServer = function() {
        var that = this;

        // Ensure server existence
        if (typeof this.app === 'undefined' || this.app === null) {
            this.app = http.createServer(this.middleware);
        }

        var httpServer = this.app;
        // Handle type of server
        if(this.app instanceof http.Server) {
            // Incorporate other listeners
            this.anotherListeners = this.app.listeners('request').splice(0);
            this.app.removeAllListeners('request');

            this.app.on('request', this.middleware);

            var port = this.options.port;
            this.app.listen(port, function() {
                if(that.options.loglevel >= 2) // above INFO level
                    console.log('LOG'.green, "devreload server listening on " + port);
            });
        } else {
            throw("Could not evaluate typeof given server!");
        }

        // Initiallize socket.io
        this.io = require('socket.io').listen(this.app, {log: this.options.loglevel >= 3});

        // Use the same log level
        this.io.set('log level', this.options.loglevel);

        this.io.sockets.on('connection', function (socket) {
            socket.emit('news', 'welcome to devreload');
        });
    };

    devreload.prototype.createWatcher = function() {
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
    };


    devreload.prototype.watchGivenFile = function(watch, poll_interval) {
        var that = this;
        fs.watchFile(watch, { persistent: true, interval: poll_interval }, function() {
            if(!that.options.quiet)
                if(that.options.loglevel >= 2) // above INFO level
                    console.log('LOG'.green, 'Changed', watch);
            that.io.sockets.emit('reload', 'changed');
        });
    };

    devreload.prototype.findAllWatchFiles = function(dir, callback) {
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
    };

    return devreload;
})();