
class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	copy() {
		return new Vector(this.x, this.y);
	}

	mag() {
		return Math.sqrt(Math.abs(this.x)**2 + Math.abs(this.y)**2);
	}

	mult(n) {
		this.x *= n;
		this.y *= n;
		return this;
	}

	norm() {
		let m = this.mag()
		this.x /= m;
		this.y /= m;
		return this;
	}

}

class Bullet {
	constructor(pos, vel) {
		this.pos = pos;
		this.vel = vel;
		this.acc = new Vector(0, 0);
		this.destroyed = false;
	}

	update(dt) {
		this.vel.add(this.acc);
		let dvel = new Vector(this.vel.x * 1/dt, this.vel.y * 1/dt);
		this.pos.add(dvel);
		this.acc.mult(0);

	}

	checkEdges() {
		if (this.pos.y < 0 || this.pos.y > cnv.height ||
			  this.pos.x < 0 || this.pos.x > cnv.width)
			this.destroyed = true;
	}

	render(dt) {
		ctx.fillStyle = '#a00';
		ctx.strokeStyle = '#a00';
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, 5, 2*Math.PI, 0);
		ctx.fill();
		ctx.stroke();
	}

	collidesRock(r) {
		if (this.detroyed) return;

		let a = r.pos.x - this.pos.x;
		let b = r.pos.y - this.pos.y;
	
		if (a*a + b*b <= (5+4*r.mass)**2) {
			this.destroyed = true;
			return true;
		}
	}

}

class Gun {
	constructor(x, y) {
		this.pos = new Vector(x, y);
		this.theta = 1.5*Math.PI;
		this.magnitude = 60;
		this.width = 10;
		this.w = this.a = this.s = this.d = false;
	}
	
	adjustAngle(x, y) {
		let v = new Vector(x - this.pos.x, y - this.pos.y);
		if (v.x == 0) return;
		if (v.x > 0) {
			this.theta = Math.atan(v.y/v.x);
		} else {
			this.theta = Math.PI + Math.atan(v.y/v.x);
		}
	}
	
	render() {
		ctx.strokeStyle = '#fff';
		ctx.beginPath();
		ctx.lineWidth = this.width;
		ctx.moveTo(this.pos.x, this.pos.y);
		let tip = this.pos.copy().add(new Vector(Math.cos(this.theta),
												 Math.sin(this.theta)).mult(this.magnitude));
		ctx.lineTo(tip.x, tip.y);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();

	}

	update(dt) {
		if (gun.w) this.pos.y -= 5;
		if (gun.a) this.pos.x -= 5;
		if (gun.s) this.pos.y += 5;
		if (gun.d) this.pos.x += 5;
	}

	shoot(x, y) {
		let v = new Vector(x - this.pos.x, y - this.pos.y).norm();
		let pos = v.copy().mult(this.magnitude).add(this.pos);
		bullets.push(new Bullet(pos, v.mult(300)));
	}
}


class Rock {
	constructor(pos, mass) {
		this.pos = pos;
		this.mass = mass;
		this.vel = new Vector(0, 0);
		this.acc = new Vector(0, 0);

		this.theta = 0;
		this.ang_vel = 0;
		this.ang_acc = 0;	

		this.points = this.createPoints();
		
		this.destroyed = false;
	}

	checkEdges() {
			
		if (this.pos.y < 0 + 2*this.mass) {
			this.pos.y = 2*this.mass;
			this.vel.y *= -1.1;
			this.ang_vel *= 1.1;
		}
		else if (this.pos.y > cnv.height - 2*this.mass) {
			this.pos.y = cnv.height - 2*this.mass;
			this.vel.y *= -1.1;
			this.ang_vel *= 1.1;
		}
		else if (this.pos.x > cnv.width - 2*this.mass) {
			this.pos.x = cnv.width - 2*this.mass;
			this.vel.x *= -0.8;
			this.ang_vel *= 1.1;
		}
		else if (this.pos.x < 0 + 2*this.mass) {
			this.pos.x = 2*this.mass;
			this.vel.x *= -1.1;
			this.ang_vel *= 1.1;
		}
	}

	createPoints() {
		let points = []
		let m = this.mass*5;
		for (let i = 0; i < m; i++) {
			let x = rand(-m, m);
			let y = rand(-m, m);
			points.push(new Vector(x, y));
		}
		return points;
	}

	rotatePoints(th) {
		let new_points = []
		for (let p of this.points) {
			let s = Math.sin(th);
			let c = Math.cos(th);
			let x = p.x * c - p.y * s;
			let y = p.x * s + p.y * c;
			let new_p = new Vector(x, y);
			new_points.push(new_p);
		}
		this.points = new_points;
	}

	update(dt) {
		// movement

		this.vel.add(this.acc);
		let dvel = new Vector(this.vel.x * 1/dt, this.vel.y * 1/dt);
		this.pos.add(dvel);
		this.acc.mult(0);

		// rotation
		let old_theta = this.theta;
		this.ang_vel = this.ang_vel + this.ang_acc;
		if (this.ang_vel > 5) this.ang_vel = 5;
		if (this.ang_vel < -5) this.ang_vel = -5;
		this.theta = this.theta + 1/dt*this.ang_vel;
		this.rotatePoints(this.theta - old_theta);
		this.ang_acc = 0;

	}

	applyForce(f) {
		this.acc.add(f);
	}

	applySpin(a) {
		this.ang_acc += a;
	}

	destroy(impact_vel) {
		this.destroyed = true;
		impact_vel.mult(0.5);
		if (this.mass > 5) {
			spawnRock(this.mass-2, this.pos.copy()).applyForce(impact_vel);
			spawnRock(this.mass-2, this.pos.copy()).applyForce(impact_vel);
		}
	}	

	render() {
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.moveTo(this.pos.x + this.points[0].x,
							 this.pos.y + this.points[0].y);
		for (let i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.pos.x + this.points[i].x,
								 this.pos.y + this.points[i].y);
		}
		ctx.closePath();
		ctx.fill();
	}
}


// HELPERS

function background() {
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, cnv.width, cnv.height);
}

let manhatten = (pa, pb) =>  Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y)
let rand = (min, max) => Math.round(Math.random() * (max - min + 1)) + min;



// GAME LOGIC

let NOW = null;
let LAST_UPDATE = Date.now();

let rocks = [];
let gun = new Gun(400, 500);
let bullets = [];
let rock_timer = 0;
let rock_wait = 10000;

function spawnRock(mass, pos) {
	let theta = Math.random()*Math.PI*2;
	let scalar = rand(50, 100);
	let f = new Vector(Math.cos(theta), Math.sin(theta)).mult(scalar);
	let a = rand(-1, 1);
	let r = new Rock(pos, mass);
	r.applyForce(f);
	r.applySpin(a);
	rocks.push(r);
	return r;
}


function setup() {
		spawnRock(9, new Vector(rand(0, cnv.width), rand(0, cnv.height)));
}

function update(dt) {

	for (let i = bullets.length-1; i >= 0; i--) {
		let b = bullets[i];
		b.checkEdges();
		b.update(dt);
		for (let r of rocks) {
			if (b.collidesRock(r)) {
				r.destroy(b.vel);
			}
		}
		if (b.destroyed) bullets.splice(i, 1);
	}


	for (let i = rocks.length-1; i >= 0; i--) {
		let r = rocks[i];
		r.checkEdges();
		r.update(dt);
		let a = r.pos.x - gun.pos.x;
		let b = r.pos.y - gun.pos.y;
		if (a*a + b*b <= (5+4*r.mass)**2) gameOver(); 
		if (r.destroyed) rocks.splice(i, 1);
	}

	gun.update(dt);
	
	rock_timer += dt;
	if (rock_timer > rock_wait) {
		spawnRock(9, new Vector(rand(0, cnv.width), rand(0, cnv.height)));
		rock_timer = 0;
		rock_wait *= 0.99;
	}
}


function render(dt) {
	background();
	for (let r of rocks) {
		r.render(dt);
	}
	for (let b of bullets) {
		b.render(dt);
	}
	gun.render();
}


function tick() {
	this.now = Date.now();
	NOW = Date.now();
	let dt = NOW - LAST_UPDATE;
	LAST_UPDATE = NOW;
	update(dt);
	render(dt);
}


function gameOver() {
	clearInterval(gameInterval);
	background();

}


// START GAME

window.onload = function () {
	window.cnv = document.getElementById('cnv');
	window.ctx = window.cnv.getContext('2d');

	window.cnv.addEventListener('mousemove', function(e) {
		let rect = window.cnv.getBoundingClientRect();
		gun.adjustAngle(e.clientX - rect.left, e.clientY - rect.top);
	});

	window.cnv.addEventListener('click', function(e) {
		let rect = window.cnv.getBoundingClientRect();
		gun.shoot(e.clientX - rect.left, e.clientY - rect.top);
	});

	window.addEventListener('keydown', function(e) {
		if (e.keyCode === 87) {
			gun.w = true;
		} else if (e.keyCode === 83) {
			gun.s = true;
		} else if (e.keyCode === 65) {
			gun.a = true;
		} else if (e.keyCode === 68) {
			gun.d = true;
		}
	});

	window.addEventListener('keyup', function(e) {
		if (e.keyCode === 87) {
			gun.w = false;
		} else if (e.keyCode === 83) {
			gun.s = false;
		} else if (e.keyCode === 65) {
			gun.a = false;
		} else if (e.keyCode === 68) {
			gun.d = false;
		}
	});

	setup();
	window.gameInterval = setInterval(tick, 20);
};
