
const cv = require("opencv");
var mat = new cv.Matrix(1000,1000);
mat.ellipse(500,500,100,100,[0,0,255], 3, 3);
console.log(mat);

/*var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer( function(request, response) {

    //console.dir(request.param);
        var filePath = '.' + request.url;
    if (filePath === './'){
        filePath = './page.html';}

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
	
    if (request.method == 'POST') {
        console.log("POST");
        var body = '';
        request.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        request.on('end', function () {
            console.log("Body: " + body);
        });
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('post might be received?');
		response.end(request.body);
		console.log(request.body);
		
    }
    else
    {

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code === 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
    }

}).listen(process.env.PORT || 5000);
console.log('Server running at port ' + process.env.PORT || 5000);
*/