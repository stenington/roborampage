// Add a method to Coquette's Maths module
Coquette.Collider.Maths.scaleVector = function (vector, scale) {
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
};

// Define the Game, which contains EVERYTHING!
function Game() {
  this.socket = io();

  // Define our entity classes and base classes  
  this.Base = function Base() {}

  this.Base.prototype.init = function (game, settings) {
    this.game = game;
    this.c = game.c;
    for (var i in settings) {
      this[i] = settings[i];
    }
    if (this.colors) {
      this.color = this.colors['alive'];
    }
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


  this.Remote = function Remote(game, settings) {
    if (game) {
      this.init(game, settings);
    }
    return this;
  }

  this.Remote.prototype = new this.Base();

  this.Remote.prototype.set = function(attrs) {
    for (var i in attrs) {
      this[i] = attrs[i];
    }
  };

  this.RemotePlayer = function RemotePlayer(game, settings) {
    this.init(game, settings);
    return this;
  }

  this.RemotePlayer.prototype = new this.Remote();

  this.RemotePlayer.prototype.collision = function() {
    if (this.game.leader && !this.dead) {
      this.dead = true;
      this.color = this.colors['dead'];
      this.game.socket.emit('dead', this.id);
    }
  };


  this.Person = function Person(game, settings) {
    this.init(game, settings);
    return this;
  }

  this.Person.prototype = new this.Base();

  this.Person.prototype.update = function() {
    this.currentSpeed = this.speed.walk;
    this.direction = {x:0, y:0};

    if (!this.dead) {
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

    this.moving = Coquette.Collider.Maths.magnitude(this.direction) !== 0;

    this.game.socket.emit('update player', {
      center: this.center,
      color: this.color,
      colors: this.colors,
      size: this.size,
      moving: this.moving
    });
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
      this.target = undefined;
      var players = [].concat(this.game.c.entities.all(this.game.Person), this.game.c.entities.all(this.game.RemotePlayer));
      for (var idx = 0; idx < players.length; idx++) {
        var player = players[idx];
        if (!player.dead && player.moving) {
          this.target = player;
          break;
        }
      }

      if (this.target) this.move();
      else this.wait();
    }

    this.game.socket.emit('update robot', {
      id: this.id,
      center: this.center,
      color: this.color,
      size: this.size
    });
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

  this.socket.emit('handshake', function (rank, id) {
    this.c = new Coquette(this, "canvas", this.width, this.height, this.background, true);

    // Our intrepid player
    var playerDefaults = { 
      id: id,
      center: { x:Math.random()*this.width, y:Math.random()*this.height },
      size: { x:9, y:9 },
      speed: { walk:2.4, run:3.6 },
      colors: { alive:"#2aa198", dead:"#2aa198" }
    };
    var player = this.c.entities.create(this.Person, extend(playerDefaults, settings.player));
    this.socket.on('dead', function(id) {
      if (id === player.id) {
        player.dead = true;
      }
    }.bind(this));

    if (rank === 'leader') {
      this.leader = true;
      console.log('I am the leader');
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
          id: i,
          center: {
            x: Math.random() * 500,
            y: Math.random() * 500
          }
        }, robotDefaults, settings.robot));
      }
    }
    else {
      var robots = {};
      this.socket.on('update robot', function(robot){
        if (!robots[robot.id]) {
          robots[robot.id] = this.c.entities.create(this.Remote, robot);
        }
        robots[robot.id].set(robot);
      }.bind(this));
    }

    var otherPlayers = {};
    this.socket.on('update player', function(other){
      if (!otherPlayers[other.id]) {
        otherPlayers[other.id] = this.c.entities.create(this.RemotePlayer, other);
      }
      otherPlayers[other.id].set(other);
    }.bind(this));

    this.socket.on('remove player', function(id){
      this.c.entities.destroy(otherPlayers[id]);
      delete otherPlayers[id];
    }.bind(this));
  }.bind(this));

  this.socket.on('win', this.win);
  this.socket.on('lose', this.lose);
};

// This checks for win/lose
Game.prototype.update = function(interval) {
  if (this.leader) {
    var allDead = true;
    this.c.entities.all(this.Person).forEach(function (person) {
      if (!person.dead) allDead = false;
    });
    this.c.entities.all(this.RemotePlayer).forEach(function (player) {
      if (!player.dead) allDead = false;
    });
    if (allDead) {
      this.lose();
      this.c.ticker.stop();
      this.socket.emit('lose');
    }

    var allWrecked = true;
    this.c.entities.all(this.Robot).forEach(function (robot) {
      if (!robot.wreck) allWrecked = false;
    });
    if (allWrecked) {
      this.win();
      this.c.ticker.stop();
      this.socket.emit('win');
    }
  }
};
