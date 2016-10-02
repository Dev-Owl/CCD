function groups(config,app,ccdEvents){
	this.app = app;
	this.config = config;
	this.groups = new Array();
	this.uuid = require('node-uuid');
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
	}

	this.cleanUp=function(){

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
}

exports.initGroups = function(config,app,ccdEvents){

	var manager = new groups(config,app,ccdEvents);
	manager.init();
	ccdEvents.on('joinGroup',function joinGroupEvent(data,ws) {
		manager.joinGroup(data,ws)
	} );

	ccdEvents.on('requestGroup',manager.addGroup);
	return manager;
};
