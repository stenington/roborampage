// Add a method to Coquette's Maths module
Coquette.Collider.Maths.scaleVector = function (vector, scale) {
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
};

// Define our entity classes and base classes  
function Base() {}

Base.prototype.init = function (game, settings) {
  this.game = game;
  this.c = game.c;
  for (var i in settings) {
    this[i] = settings[i];
  }
};

Base.prototype.draw = function(ctx) {
  ctx.fillStyle = this.color;
  ctx.fillRect(this.center.x - this.size.x / 2,
               this.center.y - this.size.y / 2,
               this.size.x,
               this.size.y);
};

Base.prototype.keepInBounds = function() {
  this.center.x = Math.max(0, this.center.x);
  this.center.x = Math.min(this.game.width, this.center.x);
  this.center.y = Math.max(0, this.center.y);
  this.center.y = Math.min(this.game.height, this.center.y);
};

Base.prototype.moveBy = function (direction, magnitude) {
  var v = Coquette.Collider.Maths.unitVector(direction);
  v = Coquette.Collider.Maths.scaleVector(v, magnitude);
  this.center.x += v.x;
  this.center.y += v.y;
};


function Person(game, settings) {
  this.init(game, settings);
  return this;
}

Person.prototype = new Base();

Person.prototype.update = function() {
  Object.keys(this.specialKeys).forEach(function(key) {
    if (this.c.inputter.isPressed(this.c.inputter[key])) {
      this.specialKeys[key].call(this);
    }
  }.bind(this));

  this.move();
}

Person.prototype.move = function() {
  var v = {x:0, y:0};
  if (this.c.inputter.isDown(this.c.inputter.UP_ARROW)) v.y += -1;
  if (this.c.inputter.isDown(this.c.inputter.DOWN_ARROW)) v.y += 1;
  if (this.c.inputter.isDown(this.c.inputter.LEFT_ARROW)) v.x += -1;
  if (this.c.inputter.isDown(this.c.inputter.RIGHT_ARROW)) v.x += 1;

  if (!Coquette.Collider.Maths.magnitude(v)) return;
  
  var speed = this.speed.walk
  if (this.c.inputter.isDown(this.c.inputter.SHIFT)) speed = this.speed.run;
  this.moveBy(v, speed);
  this.keepInBounds(); 
};

Person.prototype.collision = function(other, type) {
  this.dead = true;
};

Person.prototype.specialKeys = {
  'SPACE': function warp() {
    this.center.x = Math.random() * this.game.width;
    this.center.y = Math.random() * this.game.height;
  }
};

function Robot(game, settings) {
  this.init(game, settings);
  this.color = this.colors['alive'];
  if (this.attackStrategy === 'random') {
    var names = Object.keys(this.attacks);
    this.attackStrategy = names[Math.floor(Math.random() * names.length)];
  }
  if (this.waitStrategy === 'random') {
    var names = Object.keys(this.waits);
    this.waitStrategy = names[Math.floor(Math.random() * names.length)];
  }
  this.move = this.attacks[this.attackStrategy];
  this.wait = this.waits[this.waitStrategy];
  return this;
};

Robot.prototype = new Base();

Robot.prototype.update = function() {
  if (!this.wreck) {
    if (this.c.inputter.isDown(this.c.inputter.UP_ARROW)
        || this.c.inputter.isDown(this.c.inputter.DOWN_ARROW)
        || this.c.inputter.isDown(this.c.inputter.LEFT_ARROW)
        || this.c.inputter.isDown(this.c.inputter.RIGHT_ARROW)) this.move();
    else this.wait();
  }
};

Robot.prototype.collision = function(other, type) {
  if (other instanceof Robot) {
    this.wreck = true;
    this.color = this.colors['dead'];
  }
};

Robot.prototype.attacks = {
  direct: function directAttack() {
    var v = Coquette.Collider.Maths.vectorTo(this.center, this.target.center);    
    this.moveBy(v, this.speed.walk);
  },
  compass: function compassAttack() {
    var v = {x:0, y:0};
    var dx = this.target.center.x - this.center.x;
    var dy = this.target.center.y - this.center.y;
    if (dx < -1) v.x = -1;
    else if (dx > 1) v.x = 1;
    if (dy < -1) v.y = -1;
    else if (dy > 1) v.y = 1;
    this.moveBy(v, this.speed.walk);
  }
};

Robot.prototype.waits = {
  roam: function () {
    if (!this.wanderTarget) {
      var wanderDistance = 100;
      this.wanderTarget = {
        x: this.center.x + ((Math.random() * wanderDistance) - wanderDistance/2),
        y: this.center.y + ((Math.random() * wanderDistance) - wanderDistance/2)
      };
      this.wanderTicks = Math.random() * 600;
    }
    var v = Coquette.Collider.Maths.vectorTo(this.center, this.wanderTarget);
    this.moveBy(v, 0.2);
    this.keepInBounds();
    this.wanderTicks--;
    if (this.wanderTicks <= 0) {
      this.wanderTarget = undefined;
    }
  },
  wait: function() {}
};

// Define the Game
function Game(settings) {
  settings = settings || {};
  for (var i in settings) {
    this[i] = settings[i];
  }

  this.win = this.win || function () {};
  this.lose = this.lose || function () {};

  this.c = new Coquette(this, "canvas", this.width, this.height, this.colors.background, true);

  // Our intrepid player
  var player = this.c.entities.create(Person, { 
    center: { x:this.width/2, y:this.height/2 }, 
    size: this.sizes.player,
    speed: this.speeds.player,
    color: this.colors.player.alive
  });

  // The evil robots!
  var starts = [];
  var wait = ['wait', 'roam', 'random'][Math.floor(Math.random() * 3)];
  var attack = ['compass', 'direct', 'random'][Math.floor(Math.random() * 3)];
  for (var i=0; i<this.robots; i++) {
    starts.push({
      x: Math.random() * 500,
      y: Math.random() * 500
    });
  }
  starts.forEach(function (start) {
    this.c.entities.create(Robot, {
      center: start,
      size: this.sizes.robot,
      speed: this.speeds.robot,
      attackStrategy: attack,
      waitStrategy: wait,
      colors: this.colors.robot,
      target: player
    });
  }.bind(this));
};
Game.prototype.update = function(interval) {
  var allDead = true;
  this.c.entities.all(Person).forEach(function (person) {
    if (!person.dead) allDead = false;
  });
  if (allDead) {
    this.lose();
    this.c.ticker.stop();
  }

  var allWrecked = true;
  this.c.entities.all(Robot).forEach(function (robot) {
    if (!robot.wreck) allWrecked = false;
  });
  if (allWrecked) {
    this.win();
    this.c.ticker.stop();
  }
};