var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var uuid = require('node-uuid');
//load config
var config  = require('./config');

//init groups
var groupManager = require('./group').initGroups(config,app);


//Init web server
app.use(express.static('public'));

//configure ajax callbacks
app.get('/TableGroups', function(req, res){
	//TODO Could be a good idea to make it async
	res.send(groupManager.sendGroups(req.query.groupNameFilter,req.query.order,req.query.draw));
});

app.post('/CreateGroup',function (req,res){

});

//init websokets
app.ws('/ccdWS',function(ws,req){
	console.log("Connected new client");
	ws.on('message', function connection(msg) {
		ws.send(msg);
		console.log("message from client "+ msg);
	});
});
console.log("Server ready and starting");

app.listen(8080);
