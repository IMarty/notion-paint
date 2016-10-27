var redis = require("redis");
var express = require("express");
var expressHandlebars = require("express3-handlebars");
var app = express();

var client = redis.createClient();
var handlebars = expressHandlebars.create();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//Refactor
app.use(express.static(__dirname + '/public'));

client.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function (req, res) {
    res.render('paint');
});

app.post('/lookup/:hash', function (req, res) {
    client.set(req.params.hash, /*some code snippet*/ req.params.hash);
});

app.get('/lookup/:hash', function (req, res) {
    client.get(req.params.hash, function (val) {
        res.end(val);
    });
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

module.exports = app;
