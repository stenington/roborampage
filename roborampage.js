// Add a method to Coquette's Maths module
Coquette.Collider.Maths.scaleVector = function (vector, scale) {
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
};

// Define the Game, which contains EVERYTHING!
function Game() {

  // Define our entity classes and base classes  
  this.Base = function Base() {}

  this.Base.prototype.init = function (game, settings) {
    this.game = game;
    this.c = game.c;
    for (var i in settings) {
      this[i] = settings[i];
    }
    this.color = this.colors['alive'];
  };

  this.Base.prototype.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.center.x - this.size.x / 2,
                 this.center.y - this.size.y / 2,
                 this.size.x,
                 this.size.y);
  };

  this.Base.prototype.keepInBounds = function() {
    this.center.x = Math.max(0, this.center.x);
    this.center.x = Math.min(this.game.width, this.center.x);
    this.center.y = Math.max(0, this.center.y);
    this.center.y = Math.min(this.game.height, this.center.y);
  };

  this.Base.prototype.moveBy = function (direction, magnitude) {
    var v = Coquette.Collider.Maths.unitVector(direction);
    v = Coquette.Collider.Maths.scaleVector(v, magnitude);
    this.center.x += v.x;
    this.center.y += v.y;
  };


  this.Person = function Person(game, settings) {
    this.init(game, settings);
    return this;
  }

  this.Person.prototype = new this.Base();

  this.Person.prototype.update = function() {
    this.currentSpeed = this.speed.walk;
    this.direction = {x:0, y:0};

    Object.keys(this.controls).forEach(function(key) {
      var spec = this.controls[key];
      if (typeof spec === 'function') {
        if (this.c.inputter.isDown(this.c.inputter[key])) {
          spec.call(this);
        }
      }
      else if (spec.down || spec.up) {
        if (spec.down && this.c.inputter.isDown(this.c.inputter[key])) {
          spec.down.call(this);
        }
        if (spec.up && !this.c.inputter.isDown(this.c.inputter[key])) {
          spec.up.call(this);
        }
      }
      else if (spec.pressed) {
        if (this.c.inputter.isPressed(this.c.inputter[key])) {
          spec.pressed.call(this);
        }
      }
    }.bind(this));

    if (this.onUpdate) this.onUpdate();

    this.move();
  }

  this.Person.prototype.move = function() {
    if (!Coquette.Collider.Maths.magnitude(this.direction)) return;
    this.moveBy(this.direction, this.currentSpeed);
    this.keepInBounds(); 
  };

  this.Person.prototype.collision = function(other, type) {
    this.dead = true;
    this.color = this.colors['dead'];
  };

  this.Person.prototype.controls = {
    'UP_ARROW': function () { this.direction.y += -1; },
    'DOWN_ARROW': function () { this.direction.y += 1; },
    'LEFT_ARROW': function () { this.direction.x += -1; },
    'RIGHT_ARROW': function () { this.direction.x += 1; },
    'SHIFT': function () {
      this.currentSpeed = this.speed.run;
    },
    'SPACE': {
      pressed: function warp() {
        this.center.x = Math.random() * this.game.width;
        this.center.y = Math.random() * this.game.height;
      }
    }
  };

  this.Robot = function Robot(game, settings) {
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

  this.Robot.prototype = new this.Base();

  this.Robot.prototype.update = function() {
    if (!this.wreck) {
      if (this.c.inputter.isDown(this.c.inputter.UP_ARROW)
          || this.c.inputter.isDown(this.c.inputter.DOWN_ARROW)
          || this.c.inputter.isDown(this.c.inputter.LEFT_ARROW)
          || this.c.inputter.isDown(this.c.inputter.RIGHT_ARROW)) this.move();
      else this.wait();
    }
  };

  this.Robot.prototype.collision = function(other, type) {
    if (other instanceof this.game.Robot) {
      this.wreck = true;
      this.color = this.colors['dead'];
    }
  };

  this.Robot.prototype.attacks = {
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

  this.Robot.prototype.waits = {
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
}

function extend() {
  var args = Array.prototype.slice.apply(arguments);
  return args.reduce(function(prev, curr, idx, arr) {
    if (!curr) return prev;
    for(var key in curr) {
      prev[key] = curr[key];
    }
    return prev;
  }, {});
}

// This initializes and runs the game
Game.prototype.start = function(settings) {
  settings = settings || {};
  for (var i in settings) {
    this[i] = settings[i];
  }

  this.win = this.win || function () {};
  this.lose = this.lose || function () {};
  this.enemies = this.hasOwnProperty('enemies') ? this.enemies : 10;

  this.c = new Coquette(this, "canvas", this.width, this.height, this.background, true);

  // Our intrepid player
  var playerDefaults = { 
    center: { x:this.width/2, y:this.height/2 }, 
    size: { x:9, y:9 },
    speed: { walk:2.4, run:3.6 },
    colors: { alive:"#2aa198", dead:"#2aa198" }
  };
  var player = this.c.entities.create(this.Person, extend(playerDefaults, settings.player));

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
    this.c.entities.create(this.Robot, extend({
      center: {
        x: Math.random() * 500,
        y: Math.random() * 500
      }
    }, robotDefaults, settings.robot));
  }
};

// This checks for win/lose
Game.prototype.update = function(interval) {
  var allDead = true;
  this.c.entities.all(this.Person).forEach(function (person) {
    if (!person.dead) allDead = false;
  });
  if (allDead) {
    this.lose();
    this.c.ticker.stop();
  }

  var allWrecked = true;
  this.c.entities.all(this.Robot).forEach(function (robot) {
    if (!robot.wreck) allWrecked = false;
  });
  if (allWrecked) {
    this.win();
    this.c.ticker.stop();
  }
};
