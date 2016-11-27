var config = {};
config.maxGroupNameLength = 25; // max lenght of group name
config.maxUserNameLenght = 25 //max length of user name
config.totalGroups=150; // max groups on the server
config.maxGroupsOnScreen=35; //total number of rows in the group browser
config.defaultGroups =[{groupname:'Chris can draw',password:'peter'},{groupname:'Erntedank',password:'miau'},{groupname:'Hello world',password:''}]; // default server groups (will not be removed by cleanup)
config.eventList = ['joinGroup','requestGroup','chat','groupRegister','leaveGroup','ping','drawFrom','drawTo']; // possible client events
config.messageLimit = 256; // max size of a message
config.groupLifeTime = 360 // time in second a group will not be delete if no players are inside
//TODO Add more names to the list below
config.randomNames = ['Arlene','Francisco','Alishia','Martina','Kimberlie','Doretta','Terrence','Celsa','Adell','Shelia'];
config.commands = ['h','g','help','guess','w','r','whisper','room'];
module.exports = config;
