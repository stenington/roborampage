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
  this.color = this.colors['alive'];
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

function extend() {
  var args = Array.prototype.slice.apply(arguments);
  return args.reduceRight(function(prev, curr, idx, arr) {
    if (!curr) return prev;
    for(key in curr) {
      prev[key] = curr[key];
    }
    return prev;
  }, {});
}

// Define the Game
function Game(settings) {
  settings = settings || {};
  for (var i in settings) {
    this[i] = settings[i];
  }

  this.win = this.win || function () {};
  this.lose = this.lose || function () {};
  this.enemies = this.enemies || 10;

  this.c = new Coquette(this, "canvas", this.width, this.height, this.background, true);

  // Our intrepid player
  var playerDefaults = { 
    center: { x:this.width/2, y:this.height/2 }, 
    size: { x:9, y:9 },
    speed: { walk:2.4, run:3.6 },
    colors: { alive:"#2aa198", dead:"#2aa198" }
  };
  var player = this.c.entities.create(Person, extend(playerDefaults, settings.player));

  // The evil robots!
  var robotDefaults = {
    size: { x:9, y:9 },
    speed: { walk: 2.6 },
    attackStrategy: 'compass',
    waitStrategy: 'roam',
    colors: { alive: "#d33682", dead:  "#dc322f" },
    target: player
  };
  for (var i=0; i<this.enemies; i++) {
    this.c.entities.create(Robot, extend({
      center: {
        x: Math.random() * 500,
        y: Math.random() * 500
      }
    }, robotDefaults, settings.robot));
  }
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
