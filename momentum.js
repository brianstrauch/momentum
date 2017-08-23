// Animation
var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60) };

var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0], x = w.innerWidth || e.clientWidth || g.clientWidth, y = w.innerHeight|| e.clientHeight|| g.clientHeight;
window.onload = function() {
	document.body.appendChild(canvas);
	animate(step);
};

// Canvas
var canvas = document.createElement("canvas");
var width = canvas.width = x;
var height = canvas.height = y;
var context = canvas.getContext("2d");

var colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#16a085", "#2cc36b", "#2980b9", "#8e44ad", "#f1c40f", "#e67e22", "#e74c3c", "#f39c12", "#d35400", "#c0392b"];

// Keyboard Input
var keysDown = {}, lastKeysDown = {};
window.addEventListener("keydown", function(event) {
	keysDown[event.keyCode] = true;
});
window.addEventListener("keyup", function(event) {
	keysDown[event.keyCode] = false;
});

// Game Variables
var player;
var score = 0;

var circles, rate;
var mode = 0, timer = 0;

var step = function() {
	update();
	render();

	animate(step);
	timer++;
};

var newGame = function() {
	player = new Player();
	score = 0;

	circles = [];
	rate = 25;

	mode = 1;
	timer = 0;
}

var update = function () {
	switch(mode) {
		case 0: // Start Screen
			if(timer > 30 && keysDown[32]) { // Space
      	newGame();
			}
			break;

		case 1: // Game
			if(timer % Math.floor(8 + 10000 / timer) == 0) {
				var c = new Circle();

				var colliding = false;
				for(var i in circles) {
					if(collision(c, circles[i])) {
						colliding = true;
						break;
					}
				}

				if(!colliding) circles.push(c);
			}

			for(var i in circles) {
				var c = circles[i];

				c.update();

				// Has passed the boundaries of the screen.
				var dy = c.y - c.r;
				var dx = c.x - c.r;
				var d = -2 * c.r; // Negative Diameter
				if(dy > height|| dy < d || dx > width || dx < d) {
					delete circles[i];
					score++;
				}
			}

			player.update();
			break;

		case 2: // Game Over Screen
			if(timer > 30 && keysDown[32]) { // Space
	    	newGame();
			}

			break;
	}
};

var render = function() {
	// Background
	context.fillStyle = "#FFFFFF"; // White
	context.fillRect(0, 0, width, height);

	context.textAlign = "center";

	switch(mode) {
		case 0: // Start Screen
			context.fillStyle = "#000000"; // Black
			context.font = "72px Courier New";
			context.fillText("MOMENTUM", width >> 1, height >> 1);

			context.font = "20px Courier New";
			if(timer % 60 < 30) context.fillText("Press Space To Play", width >> 1, height * 0.6);

			context.fillStyle = "#3498DB";
			context.font = "15px Courier New";
			context.fillText("Made By Brian Strauch", width >> 1, height * 0.95);

			break;

		case 1: // Game
			for(var i in circles) circles[i].render();

			context.fillStyle = "#000000"; // Black
			context.font = "40px Courier New";
			context.fillText(score, width >> 1, height / 10);

			player.render();

			break;

		case 2: // Game Over Screen
			context.fillStyle = "#000000";

			context.font = "40px Courier New";
			context.fillText(score, width >> 1, height / 10);

			context.font = "72px Courier New";

			context.fillText("GAME OVER", width >> 1, height >> 1);
			context.font = "20px Courier New";
			if(timer % 60 < 30) context.fillText("Press Space To Play Again", width >> 1, height * 3 / 5);

			context.fillStyle = "#3498db";
			context.font = "15px Courier New";
			context.fillText("Made By Brian Strauch", width >> 1, height * 19 / 20);

			break;
	}
};

function Player() {
	this.r = width * 0.02;

	this.x = width >> 1;
	this.y = height * 0.8;

	this.v = 7;

	this.c = "#000000"; // Black

	this.update = function() {
		if(keysDown[37]) { // Left Arrow
			if(this.x - this.r - this.v >= 0) { // Bounds Check
				this.x -= this.v;
			}
		}
		else if(keysDown[39]) { // Right Arrow
			if(this.x + this.r + this.v <= width) { // Bounds Check
				this.x += this.v;
			}
		}

		for(var i in circles) {
			if(collision(player, circles[i])) {
				mode = 2; // Game Over
			}
		}
	};

	this.render = function() {
		context.fillStyle = this.c;

		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		context.fill();
	};
};

function Circle() {
	this.r = Math.floor(Math.random() * width * 0.06) + width * 0.02;

	this.x = Math.floor(Math.random() * (width - (this.r << 1))) + this.r; // [0, width - w)
	this.y = -this.r; // Start from above the screen.
	this.lastX = 0;
	this.lastY = 0;

	this.m = Math.PI * this.r * this.r; // Area

	this.vx = 0;
	this.vy = Math.random() * 4 + 2; // Velocity Vector

	this.c = colors[Math.floor(Math.random() * colors.length)]; // [0, length)

	this.update = function() {
		this.x += this.vx;
		this.y += this.vy;

		var colliding = false;
		for(var i in circles) {
			var c = circles[i];
			if(c == this) continue;
			if(collision(this, c)) {
				elasticCollision(this, c);
				colliding = true;
			}
		}
		if(!colliding) {
			this.lastX = this.x;
			this.lastY = this.y;
		}
	};

	this.render = function() {
		context.fillStyle = this.c;

		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		context.fill();
	};
};

var collision = function(a, b) {
	// Circle collision detection.
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	var d = Math.sqrt(dx * dx + dy * dy);
	return d < a.r + b.r;
};

var angle = function(vx, vy) {
	// Angle Finder
	var a;

	if(vx < 0) a = Math.PI + Math.atan(vy / vx);
	else if(vx > 0 && vy >= 0) a = Math.atan(vy / vx);
	else if(vx > 0 && vy < 0) a = 2 * Math.PI + Math.atan(vy / vx);
	else if(vx == 0 && vy == 0) a = 0;
	else if(vx == 0 && vy >= 0) a = Math.PI / 2;
	else a = Math.PI * 3 / 2;

	return a;
}

var elasticCollision = function(a, b) {
	var av = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
	var bv = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

	var aa = angle(a.vx, a.vy);
	var ba = angle(b.vx, b.vy);

	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var phi;
	if(dx == 0) {
		phi = Math.PI / 2;
	}
	else {
		phi = Math.atan(dy / dx);
	}

	var a1 = (av * Math.cos(aa - phi) * (a.m - b.m) + 2 * b.m * bv * Math.cos(ba - phi)) / (a.m + b.m);
	var a2 = av * Math.sin(aa - phi);
	var a3 = phi + Math.PI / 2;
    	var avx = a1 * Math.cos(phi) + a2 * Math.cos(a3);
    	var avy = a1 * Math.sin(phi) + a2 * Math.sin(a3);

	var b1 = (bv * Math.cos(ba - phi) * (b.m - a.m) + 2 * a.m * av * Math.cos(aa - phi)) / (a.m + b.m);
	var b2 = bv * Math.sin(ba - phi);
	var b3 = phi + Math.PI / 2;
  	var bvx = b1 * Math.cos(phi) + b2 * Math.cos(b3);
    	var bvy = b1 * Math.sin(phi) + b2 * Math.sin(b3);

    	a.vx = avx; a.vy = avy;
    	b.vx = bvx; b.vy = bvy;
};
