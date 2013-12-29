(function() {
    "use strict";

    var baseURL;

    var loadJS = function(url, callback) {
        var jsFile = document.createElement('script');
        jsFile.setAttribute('type', 'text/javascript');
        jsFile.setAttribute('src', url);
        jsFile.async = false;

        jsFile.onreadystatechange = jsFile.onload = function () {

            var state = jsFile.readyState;

            if (!state || /loaded|complete/.test(state)) {
                if (callback) callback();
            }
        };

        document.head.appendChild(jsFile);
    };

    var createIO = function() {
        var socket = io.connect(baseURL);
        socket.on('news', function (data) {
            console.log(data);
        });

        socket.on('reload', function(data) {
            console.log('reload', data);
            window.location.reload(true);
        });
    };

    document.addEventListener('DOMContentLoaded',function(){

        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src') || '';
            if (src.match(/devreload\.js$/)) {
                baseURL = src.split('devreload.js')[0];
                break;
            }
        }
        if (!baseURL) {
            throw new Error('Cannot implement function using socket.io');
        }

        if (!window.io) {
            loadJS(baseURL + 'socket.io/socket.io.js', createIO);
        } else {
            createIO();
        }

    });
})();