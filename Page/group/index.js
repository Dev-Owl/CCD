function groups(config,app){
	this.app = app;
	this.config = config;
	this.groups = new Array();
	this.uuid = require('node-uuid');

	this.init = function(){
		var dGroups = this.config.defaultGroups;
		for(var i=0, len = dGroups.length; i< len; i++){
			this.groups.push({
								id:this.uuid.v4(),
								groupname:dGroups[i].groupname,
								password:dGroups[i].password,
								player: 0
							 });
		}
	};

	this.addGroup = function(group){

	};

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
				this.groups[i].player]);
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

		return JSON.stringify({
													 draw:drawNumber,
													 data:groupViewModel,
													 recordsTotal:this.groups.length,
													 recordsFiltered:groupViewModel.length
												 });
	};
}

exports.initGroups = function(config,app){

	var manager = new groups(config,app);
	manager.init();
	return manager;
};
