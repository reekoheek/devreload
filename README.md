devreload
=========

Development auto reloader for browser

devreload monitors changes in the file system. As soon as you save a file, it is notify browser that open your website, and the browser is refreshed.

## Usage

You can use devreload as:

* CLI script, or
* Embedded package to node web application, or
* Manual reload to invoke from bigger library/application

### Install as CLI Script

Install as global cli script

```
npm install -g devreload
```

Don't forget to add devreload script to your html files

```html
<script type="text/javascript" src="http://localhost:9999/devreload.js"></script>
```

after that, you can run devreload from your project path
```
cd [project-path]
devreload
```

### Use as embedded package

Use as embedded package to node web app require you to install devreload as node module

```
npm install devreload
```

Require and initialize devreload to listen to plain node http server


```javascript
// initialize node http server
var server = http.createServer(function(req, res) {
    // ... your request handler
});

// ...

// listen devreload to server
require('devreload').listen(server, {
    watch: [__dirname+'/views', __dirname+'/static'], // watch dirs
    interval: 500 // set watch intervals
})

// ```

// server will listen to port 3001
server.listen(3001);
```

Don't forget to include the client script in your html/jade

```html
<script defer src='//localhost:9999/devreload.js'></script>
```

```jade
script(defer, src='//localhost:9999/devreload.js')
```

### Use manual reload for bigger application

You can also use devreload to invoke reload for bigger application (such as nodeamon)

```javascript
var devreload, http, ndm;
ndm = require('nodemon');
devreload = require('devreload');
http = require('http');

devreload.listen(http.createServer(), {
  watch: null, // if watch is null (explicitly specified), 
               // watch will be disabled. you should explicitly
               // manual reload
  port: 9999
});

ndm({
  script: 'app.coffee',
  ignore: ['static/*']
}).on('restart', function(files) {
  return devreload.reload();
}).on('log', function(log){
  return console.log(log.colour);
};
```


# Contributors:
- Ganesha
- Cole R Lawrence
