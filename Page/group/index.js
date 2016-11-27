//TODO Add a function to search the groups to unify group searching
/*
	search( {propA = valueA,propB = valueB},stopOnFirst)
*/
function groups(config,app,ccdEvents){
	//Ref to webserver and running app
	this.app = app;
	//Ref to global config
	this.config = config;
	//Groups hosted by ccd
	this.groups = new Array();
	//GUID module for nodejs
	this.uuid = require('node-uuid');
	//Form parsing module for nodejs
	this.formidable = require('formidable');
	//File system layer for nodejs
	this.fs = require('fs');
	//Event handler for CCD events
	this.ccdEvent = ccdEvents;
	//Init function to setup defaults for ccd, called once by plugin init
	this.init = function(){
		var dGroups = this.config.defaultGroups;
		for(var i=0, len = dGroups.length; i< len; i++){
			this.groups.push({
								id:this.uuid.v4(),
								groupname:dGroups[i].groupname,
								password:dGroups[i].password,
								player: [],
								serverGroup: true // never delete
							 });
		}
	};

	//Add a new group, requires socket and group data
	this.addGroup = function(data,ws){
		console.log(data);
		var response = {rType:"requestGroup",result:{go:false,msg:""}};
		if(data
			 && data.name
			 && data.name.length <= this.config.maxGroupNameLength
			 && (data.public || data.pw)
		 	 && this.groups.length < this.config.totalGroups)
		{
			var validRequest = true;
			for(var i=0, len = this.groups.length; i <len; i++){
					if(this.groups[i].groupname == data.name){
						response.result.msg="Group name not free";
						validRequest = false;
						break;
					}
			}
			if(validRequest){
				var newGroup = {
									id:this.uuid.v4(),
									groupname:data.name,
									password:data.pw,
									player: [],
									lifetime : Math.floor(new Date() / 1000) + this.config.groupLifeTime // next check possible in x seconds
								};

				response.result.msg = "Go go go";
				response.result.go  = true;
				//Add the creating using wih a randome name as drawer in the group
				var randomNames = this.config.randomNames;
				var newPlayer = this.generateUser(randomNames[Math.floor(Math.random()*randomNames.length)],
																					'draw' // only one in the room,
																				);
				response.result.uID = newPlayer.id;
				response.result.groupID = newGroup.id;
				newGroup.player.push(newPlayer); // add player to group
				this.groups.push(newGroup); // add group to global data
				this.ccdEvent.emit('updateGroupData'); // inform about change group data
			}
		}
		else{
				response.result.msg="Invalid request";
		}
		ws.send(JSON.stringify(response));
		//if time clean up
		setTimeout(this.cleanUp(),0);
	};

	//Generates a new user with the given role (not added to a group)
	this.generateUser = function(userName,userRole){
		return {id : this.uuid.v4(),name: userName, role:userRole,soc:null};
	}

	//Checks if the user name is avalible in the given user list (group)
	this.userFree = function(players,newUser){
		for(var i=0, len = players.length; i <len; i++){
			if(players[i].name === newUser)
					return false;
		}
		return true;
	}

	//Tries to join a user in a group, socket and join data required
	this.joinGroup = function(data,ws){
			var response = {rType:"joinGroup",result:{go:false,msg:""}};
			if(data && data.group && data.user && data.user.length <= this.config.maxUserNameLenght){
				for(var i=0, len = this.groups.length; i <len; i++){
						if(this.groups[i].id == data.group){
								if(this.groups[i].password === data.pw){
										if(this.userFree(this.groups[i].player,data.user))
										{
												var newRole = this.groups[i].player.length > 0 ? 'guess':'draw';
												var newPlayer = this.generateUser(data.user,newRole);
												this.groups[i].player.push(newPlayer);
												response.result.msg = "Go go go";
												response.result.go  = true;
												response.result.uID = newPlayer.id;
												response.result.groupID = 	this.groups[i].id;
												this.ccdEvent.emit('updateGroupData');
										}
										else{
											response.result.msg="Username not free";
										}

								}
								else{
									response.result.msg="Invalid password";
									break;
								}
						}
				}
			}
			else {
				response.result.msg="Invalid request";
			}
			ws.send(JSON.stringify(response));
			//if time clean up
			setTimeout(this.cleanUp(),0);
	}
	//Clean up empty groups
	this.cleanUp=function(){
		//TODO add code here or it will get messy
	};

 	//Sends groups to the front page, depending on the filter and order
	this.sendGroups = function(filter,order,drawNumber){
		var groupViewModel = new Array();
    var nameFilter = null;
		//Set filter if needed
		if(filter){
				console.log("Filter set");
				nameFilter = filter.toLowerCase();
		}
    //Apply default order by name
		if(!order){
			order = {column:2,dir:'asc'};
		}
		else{
			order = order[0];
		}

		//TODO:Make async with settimeout 0 and a callback
		for(var i=0, len = this.groups.length; i <len; i++){
      //Apply filter
			if(nameFilter && this.groups[i].groupname.toLowerCase().indexOf(nameFilter) == -1){
				continue;
			}
			groupViewModel.push([
				this.groups[i].id,
				!(this.groups[i].password ===""),
				this.groups[i].groupname,
				this.groups[i].player.length]);
		}


		groupViewModel.sort(function(a,b){
      console.log("order");
			console.log(order);
			if(order.dir ==='asc')
				return (a[order.column] < b[order.column]) ? -1 : 1;
			else
			  return (a[order.column] > b[order.column]) ? -1 : 1;
		});
		groupViewModel.splice(0,Math.max(groupViewModel.length- this.config.maxGroupsOnScreen,0));
		//if time clean up
		setTimeout(this.cleanUp(),0);
		return JSON.stringify({
													 draw:drawNumber,
													 data:groupViewModel,
													 recordsTotal:this.groups.length,
													 recordsFiltered:groupViewModel.length
												 });
	};

	//Called by the front page after a sucssesfull call to joinGroup
	this.joinProgress = function(req,res){
			var form = new this.formidable.IncomingForm();
			var manager = this;
			console.log("Start join process");
			form.parse(req, function (err, fields, files) {
					res.writeHead(200, {
						'content-type': 'text/html'
					});
					if(err){
						 console.log("Error parsing from");
						 console.log(err);
						 //TODO Duplicated code make it nicer
						 //In case of any error we go back to index
						 manager.fs.readFile('public/index.html',function(err,data){
							 console.log("Back to index my friend");
							 res.write(data);
							 res.end();
						 });
					}else{
						console.log("Form is fine");
						//check form values
						console.log(fields);
						if(fields && fields.user && fields.group)
						{
								var go = false;
								for(var i=0, len = manager.groups.length; i <len; i++){
								 	if(manager.groups[i].id == fields.group){
										for(var x=0, len = manager.groups[i].player.length; x <len; x++){
											if(manager.groups[i].player[x].id == fields.user){
												go = true;
												break;
											}
										}
								}
								if(go)
							 		break;
								}
								if(go){
									manager.fs.readFile('group.html','utf8',function(err,data){
										console.log("Heading to group view");
										//Super shity "template" :D
										res.write(data.replace('@USERID',"'"+fields.user+"'").replace('@GROUPID',"'"+fields.group+"'"));
										res.end();
									});
								}
								else{
									//TODO Duplicated code
									manager.fs.readFile('public/index.html',function(err,data){
										console.log("Back to index my friend you are not in this group");
										res.write(data);
										res.end();
									});
								}

						}
						else
						{
							//TODO Duplicated code make it nicer
							manager.fs.readFile('public/index.html',function(err,data){
								console.log("Back to index my friend missing data");
								res.write(data);
								res.end();
							});
						}
					}
				});
	}

	//Send a chat message in the group
	this.chatMessage = function(data,ws){
		  console.log("chat message");
			if(data.usr && data.grp && data.txt){
				var authData = this.validRequest(data.usr,data.grp);
				if(authData)
				{
					 data.usr.soc = ws; // ensure soc is active
					 console.log("chat message -> valid user");
					 //Ensure that it is not a command first character is \
					 if(data.txt.length > 0 && data.txt[0] === '\\')
					 {
						 	console.log("Command request");
						 	this.commandMessage(data.txt,ws,authData);
					 }
					 else
					 {
						 this.broadcastToGroup(authData.grp,
							 	this.buildChatMessage(authData.usr.name+": "+data.txt,false));
					 }
				}
				else{
					console.log("chat message -> invalid user");
				}
			}
	};
	//Build chat response, also used for server to user messages
	this.buildChatMessage = function(text,serverMessage){
		var response = this.buildResponse("chat");
		response.message = {txt: text,broadcast:serverMessage};
		return response;
	};

  //Build basic response object that is used in any response to the client
	this.buildResponse = function(type){
		return {
							rType:type
					 };
	};

	//Works on a command message, all starting with \
	this.commandMessage = function(message,ws,authData){
			//Split into the different parts
			var commandParts = message.split(/[ ]+/);
			//Ensure that we have at least one part
			if(commandParts.length >0){
					var command = commandParts[0].replace("\\","");
					console.log("searching for "+command);
					console.log("we have " +JSON.stringify(this.config.commands));
					var index = this.config.commands.indexOf(command);
					if(index >= 0){
						switch (this.config.commands[index]) {
							case 'h':
							case 'help':
									this.helpTextToUser(authData,ws,true);
									break;
							case 'g':
							case 'guess':
									this.checkGuess(ws,commandParts,authData);
									break;
							case 'r':
							case 'room':
									this.roomToUser(ws,authData);
									break;
							case 'w':
							case 'whisper':
									this.whisperTo(ws,commandParts,authData);
									break;
							default:
									this.helpTextToUser(authData,ws,false,"Oh, something went wrong :)");
						}
					}
					else{
						//No idea whats it is
						this.helpTextToUser(authData,ws,false,"Unknown or disabled command!");
					}
			}
			else {
				this.helpTextToUser(authData,ws,false,"Invalid command!");
			}
	};

	//Send the help text either full or small to a given user
	this.helpTextToUser = function(authData,ws,full,hint){
		if(!full){
			this.sendToUser(authData,this.buildChatMessage(hint+" For full help use \\h command.",true));
		}
		else{
			if(!hint){
				hint =""; //ensure it is just an empty string
			}
			this.sendToUser(authData,this.buildChatMessage(hint+"You can use the following commands:\n \\g for guess -> \\g cat \n \\w for whisper -> \\w user message \n \\r for room info -> \\r ",true));
		}

	};
	//Update socket of the user
	this.pingFromClient = function(data,ws){
		if(data.usr && data.grp){
			var authData = this.validRequest(data.usr,data.grp);
			if(authData)
			{
				authData.usr.soc = ws;
			}
		}
	};

	//send a message to a single user
	this.sendToUser = function(authData, message){
		var message = JSON.stringify(message);
		if(authData.usr.soc && authData.usr.soc.readyState === 1){
			authData.usr.soc.send(message);
		}
		else if(authData.usr.soc && authData.usr.soc.readyState != 1 )
		{
			console.log(authData.grp);
			this.removePlayer(authData.grp,authData.usr.id);
		}
	};

	//validate a guess for a group, socket splitted comamnd authData of the user
	this.checkGuess = function(ws,command,authData){
				//TODO Implement logic here
				console.log("guess from user");
				this.sendToUser(authData,this.buildChatMessage("No no no, not done yet!",true));
	};

	//sends the user list of the given room to the given user
	this.roomToUser = function(ws,authData){
			var message = "Users in this room:\n";
			for(var i=0, len = authData.grp.player.length; i <len; i++)
			{
				message +=authData.grp.player[i].name +"\n";
			}
			this.sendToUser(authData,this.buildChatMessage(message,true));
	};

	//whisper to the given user
	this.whisperTo = function(ws,command,authData){
				//TODO Implement logic here
				this.sendToUser(authData,this.buildChatMessage("No no no, not done yet!",true));
	};

	//Called to send a message/data to all members in a group
	this.broadcastToGroup = function(group,message){
		var message = JSON.stringify(message);
		console.log(message);
		for(var i=0, len = group.player.length; i <len; i++){
				if(group.player[i].soc && group.player[i].soc.readyState === 1){
					group.player[i].soc.send(message);
				}
				else if(group.player[i].soc && group.player[i].soc.readyState != 1 )
				{
					console.log("dead session");
					console.log(group.player[i]);
					this.removePlayer(group,group.player[i].id);
				}
		}
	};

	//Validates are request/message from and to a group
	this.validRequest =function(userID,groupID){
			var group = this.getGroupByID(groupID);
			var user = this.userInGroup(group.player,userID);
			if(group &&  user)
			{
					return {grp: group, usr: user};
			}
			return null;
	};

	//Checks if the given user is in the user list
	this.userInGroup = function(players,userID){
		for(var i=0, len = players.length; i <len; i++){
			if(players[i].id === userID)
					return players[i];
		}
		return null;
	};

	//Gets the group object by the GUID
	this.getGroupByID = function(groupID){
		for(var i=0, len = this.groups.length; i <len; i++){
				if(this.groups[i].id == groupID){
					return this.groups[i];
				}
			}
	};

	//Informs user about a new user in a given group
	this.groupRegisterCompleted = function(data,ws){
		var authData = this.validRequest(data.usr,data.grp);
		if(authData)
		{
			console.log(authData.usr);
			if(authData.usr.soc && authData.usr.soc.readyState != 1){
					authData.usr.soc = null;console.log("Dead connection stored for current user reset to null");
			}
			this.broadcastToGroup(authData.grp,{rType:'chat' ,message: { txt:"User "+authData.usr.name+" joined",broadcast:true}});
			authData.usr.soc = ws;
		}
	};

	//User leaves the group and other users are informed
	this.leaveGroup = function(data,ws){

		var authData = this.validRequest(data.usr,data.grp);
		if(authData)
		{
				if(this.removePlayer(authData.grp,data.usr))
				{
						this.broadcastToGroup(authData.grp,{rType:'chat' ,message: { txt:"User "+authData.usr.name+" left",broadcast:true}});
						this.ccdEvent.emit('updateGroupData');
				}
		}
	};

	//Removes a player from the given group
	this.removePlayer = function(group,userID){
		var removeIndex = -1;
		for(var i=0, len = group.player.length; i <len; i++){
			if(group.player[i].id === userID){
					removeIndex = i;
					break;
			}
		}
		if(removeIndex > -1){
			console.log("player removed from group")
			group.player.splice(removeIndex,1);
			return true;
		}
		return false;
	};

	//Send draw data to group, start says if to move pen to point or ongoing drawing
	this.draw = function(data,ws,start){
		var authData = this.validRequest(data.usr,data.grp);
		if(authData)
		{
			//TODO implement message to share draw data
		}
	};

}
//Init plugin function for nodjs
exports.initGroups = function(config,app,ccdEvents){

	var manager = new groups(config,app,ccdEvents);
	manager.init();
	ccdEvents.on('joinGroup',function joinGroupEvent(data,ws) {
		manager.joinGroup(data,ws)
	} );

	ccdEvents.on('requestGroup',function joinGroupEvent(data,ws) {
		manager.addGroup(data,ws)
	} );

	ccdEvents.on('chat',function chatMessageEvent(data,ws){
		manager.chatMessage(data,ws);
	});

	ccdEvents.on('groupRegister',function chatMessageEvent(data,ws){
		manager.groupRegisterCompleted(data,ws);
	});

	ccdEvents.on('leaveGroup',function leaveGroupEvent(data,ws){
		manager.leaveGroup(data,ws);
	});

	ccdEvents.on('ping',function pingFromClient(data,ws){
		manager.pingFromClient(data,ws);
	});

	ccdEvents.on('drawFrom',function drawFromClient(data,ws){
		manager.draw(data,ws,true);
	});

	ccdEvents.on('drawTo',function drawToClient(data,ws){
		manager.draw(data,ws,false);
	});

	return manager;
};
