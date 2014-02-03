devreload
=========

Development auto reloader for browser

devreload monitors changes in the file system. As soon as you save a file, it is notify browser that open your website, and the browser is refreshed.

## Usage

You can use devreload as:

* CLI application or
* Embedded package to node web application

### Install
```
npm install -g devreload
```

### 1 Adding devreload script to your html files
```html
<script type="text/javascript" src="http://localhost:9999/devreload.js"></script>
```

### 2 Run devreload from your project path
```
cd [project-path]
devreload
```

## Or usage as embedded package to node web app

```
npm install devreload
```

### 1. Require and Initiallize
```javascript
var server = http.createServer();

...

require('devreload').listen(server, {
    watch: [__dirname+'/views', __dirname+'/static'],
    interval: 500,
    port: 9999
})
```

### 2. Include the client script in your html/jade
```html
<script defer src='//localhost:9999/devreload.js'></script>
```
```jade
script(defer, src='//localhost:9999/devreload.js')
```

# Contributors:
- Ganesha
- Cole R Lawrence
