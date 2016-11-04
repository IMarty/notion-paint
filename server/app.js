var redis = require("redis");
var express = require("express");
var expressHandlebars = require("express3-handlebars");
var app = express();
var uuid = require('node-uuid');

var client = redis.createClient();
var handlebars = expressHandlebars.create();
var http = require('http');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//Refactor
app.use(express.static(__dirname + '/public'));

client.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function (req, res) {
    res.render('homepage');
});

app.get('/canvas/:hash', function (req, res) {
    res.render('paint');

});

app.post('/api/new', function (req, res) {
    var hash = uuid.v1();
    client.set(hash, JSON.stringify({imageData: []}));
    res.json({hash: hash});
});

// custom 404 page
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// custom 500 page
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

//get port from environment and store in Express.
var port = normalizePort(process.env.PORT || 8080);
app.set("port", port);

//create http server
var server = http.createServer(app);
var io = require('socket.io')(server);

var redisSocket = require('socket.io-redis');
io.adapter(redisSocket({ host: 'localhost', port: 6379 }));

io.on('connection', function(socket){
    socket.on('getInitialData', function(hash) {
        client.get(hash, function (idk, data) {
            socket.emit('initialData', data);
        });
    });
});




//listen on provided ports
server.listen(port);

module.exports = server;
