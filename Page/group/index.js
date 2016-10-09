//TODO Add a function to search the groups to unify group searching
/*
	search( {propA = valueA,propB = valueB},stopOnFirst)
*/
function groups(config,app,ccdEvents){
	this.app = app;
	this.config = config;
	this.groups = new Array();
	this.uuid = require('node-uuid');
	this.formidable = require('formidable');
	this.fs = require('fs');
	this.ccdEvent = ccdEvents;

	this.init = function(){
		var dGroups = this.config.defaultGroups;
		for(var i=0, len = dGroups.length; i< len; i++){
			this.groups.push({
								id:this.uuid.v4(),
								groupname:dGroups[i].groupname,
								password:dGroups[i].password,
								player: []
							 });
		}
	};

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
									player: []
								};

				response.result.msg = "Go go go";
				response.result.go  = true;
				//Add the creating using wih a randome name as drawer in the group
				var randomNames = this.config.randomNames;
				var newPlayer = this.generateUser(randomNames[Math.floor(Math.random()*randomNames.length)],
																					'draw', // only one in the room
																					ws
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

	this.generateUser = function(userName,userRole,ws){
		return {id : this.uuid.v4(),name: userName, role:userRole,ws};
	}
	this.userFree = function(players,newUser){
		for(var i=0, len = players.length; i <len; i++){
			if(players[i].name === newUser)
					return false;
		}
		return true;
	}

	this.joinGroup = function(data,ws){
			var response = {rType:"joinGroup",result:{go:false,msg:""}};
			if(data && data.group && data.user && data.user.length <= this.config.maxUserNameLenght){
				for(var i=0, len = this.groups.length; i <len; i++){
						if(this.groups[i].id == data.group){
								if(this.groups[i].password === data.pw){
										if(this.userFree(this.groups[i].player,data.user))
										{
												var newRole = this.groups[i].player.length > 0 ? 'guess':'draw';
												var newPlayer = this.generateUser(data.user,newRole,ws);
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

	this.cleanUp=function(){
		//TODO add code here or it will get messy
	};
 	//TODO add a complete callback to allow async
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

}

exports.initGroups = function(config,app,ccdEvents){

	var manager = new groups(config,app,ccdEvents);
	manager.init();
	ccdEvents.on('joinGroup',function joinGroupEvent(data,ws) {
		manager.joinGroup(data,ws)
	} );

	ccdEvents.on('requestGroup',function joinGroupEvent(data,ws) {
		manager.addGroup(data,ws)
	} );
	return manager;
};
