devreload
=========

Dev Reload

## Usage

```
npm install devreload
```

### 1. Require and Initiallize
```javascript
require('devreload').run({watch:[__dirname+'/views', __dirname+'/static'], interval:500, port:3001})
```

### 2. Include the client script in your page 
```jade
script(defer, src='//localhost:3001/devreload.js')
```
