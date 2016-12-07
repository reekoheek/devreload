var express = require('express'),
    devreload = require('../../lib/devreload.js'),
    fs = require('fs'),
    app = express();

app.set('port',3000);

app.all('/',function(req,res){
    res.setHeader('Content-Type', 'text/html');
    res.write([
        '<html>',
            '<head>',
                '<title>devreload Express</title>',
            '</head>',
            '<body>',
                '<h1>',
                    fs.readFileSync('doc.txt'),
                '</h1>',
                '<script src="/devreload.js"></script>',
            '</body>',
        '</html>'
    ].join('\n'));
    res.end();
});


httpServer = app.listen(app.get('port'));
new devreload(httpServer, {port:app.get('port'), watch:['doc.txt']});