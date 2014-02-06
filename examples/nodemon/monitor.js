var nodemon = require('nodemon'),
	devreload = require('../../lib/devreload.js');

// Explicitly tell devreload to not watch files,
// because nodemon will do that for us.
devreload.listen({watch:null});

// Explicitly specify the file extensions you
// need to monitor.
nodemon({script:'app.js', watch:['doc.txt'], ext:'txt js'})
	// When nodemon restarts the server
	.on('restart', function(files){
		// Reload devreload
		devreload.reload();
	})
	// Log nodemon ouput
	.on('log', function(log){
		console.log(log.colour);
	});