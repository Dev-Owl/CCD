//Load modules
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var uuid = require('node-uuid');
var events = require('events');
//Event emitter for application
var ccdEvents = new events.EventEmitter();
var clients = [];

//default error handler
//TODO Find out why this is never called at all
ccdEvents.on('error',(err) => {
		//TODO Add real error logger/handler
		console.log('Error in eventhandler ->' + err);
});

/*process.on('uncaughtException', (err) => {
  console.log('whoops! there was an error %s',err);
});*/


//load config
var config  = require('./config');

//init groups
var groupManager = require('./group').initGroups(config,app,ccdEvents);


//Init web server
app.use(express.static('public'));

//configure ajax callbacks
app.get('/TableGroups', function(req, res){
	//TODO Could be a good idea to make it async
	res.send(groupManager.sendGroups(req.query.groupNameFilter,req.query.order,req.query.draw));
});


//init websokets
app.ws('/ccdWS',function(ws,req){
	console.log("Connected new client");
	ws.on('message', function connection(msg) {
		if(msg.length <= config.messageLimit){
				var client_msg = JSON.parse(msg);
				if(config.eventList.indexOf(client_msg.rType)>-1)
				{
					ccdEvents.emit(client_msg.rType,client_msg.data,ws);
				}
				else{
					console.log("Unknown request by client! "+msg);
				}
		}
		else{
			console.log("Message limit exceeded! Message was %d limit is set to %d",msg.length,config.messageLimit);
		}

	});
});
ccdEvents.on("updateGroupData",function(){
		expressWs.getWss().clients.forEach((client) => {
				//TODO Add reall response object for client here
				client.send("New group data");
		});
});
console.log("Server ready and starting");

app.listen(8080);
