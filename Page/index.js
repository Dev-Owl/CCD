var express = require('express'),
	app = express();
 
app.use(express.static('public'));
app.post('/groups', function(req, res){
	res.send("It works");
});
 
app.listen(8080);