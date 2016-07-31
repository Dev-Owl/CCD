function ccdCanvas(options)
{
	this.options = options;
	this.canvas  = document.getElementById(options.element);
	this.context = this.canvas.getContext('2d');
	this.drawing = false;
	var self = this;
	this.canvas.onmousedown = function(e) {
		self.drawing = true;
		self.context.moveTo(e.clientX, e.clientY);
		if(self.options.drawFrom){
			self.options.drawFrom(e);
		}
	};
	this.canvas.onmousemove = function(e) {
		if (self.drawing) {
			self.context.lineTo(e.clientX, e.clientY);
			self.context.stroke();
			if(self.options.drawTo){
				self.options.drawTo(e);
			}
		}
	};
	this.canvas.onmouseup = function() {
		self.drawing = false;
	};
	
	this.getContent = function(){
		return self.canvas.toDataURL("image/png");
	};
	this.setContent = function(Content){
		//Dirty :D
		var img = new Image();
		img.src = Content;
		img.onload = function (){
			self.context.drawImage(img, 0, 0, img.width,    img.height,    // source rectangle
                   0, 0, self.canvas.width, self.canvas.height); // destination rectangle
		};
	};
	
	this.clear = function(){
		self.context.beginPath();
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
	};
	
	return this;
}
