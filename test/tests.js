describe('Extra Maths', function() {
  it('should have scaleVector', function () {
    Coquette.Collider.Maths.scaleVector.should.be.a.Function;
  });
});

describe('Game', function() {
  afterEach(function() {
    this.g.c.ticker.stop(); // stop the current game instance
  });

  it('should call win on win', function (done) {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 2,
      win: done
    });
    var robots = g.c.entities.all(g.Robot);
    robots[0].collision(robots[1]);
    robots[1].collision(robots[0]);
  });

  it('should call lose on lose', function (done) {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 2,
      lose: done
    });
    g.c.entities.all(g.Person).forEach(function(entity) {  
      entity.dead = true;
    });
  });

  it('should allow 0 enemies', function () {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 0
    });
    g.c.entities.all(g.Robot).length.should.equal(0);
  });
});

describe('Game Controls', function () {
  afterEach(function() {
    this.g.c.ticker.stop(); // stop the current game instance
  });

  it('should run key function continuously when down', function (done) {
    var g = this.g = new Game();
    var times = 0;
    g.Person.prototype.controls = {
      'A': function() { times++; }
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
    g.c.inputter._buttonListener._down(g.c.inputter.A);
    setTimeout(function() {
      g.c.ticker.stop();
      times.should.be.greaterThan(1);
      done();
    }, 100);
  });

  it('should not run key function when up', function (done) {
    var g = this.g = new Game();
    var times = 0;
    g.Person.prototype.controls = {
      'A': function() { times++; }
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
    setTimeout(function() {
      times.should.equal(0);
      done();
    }, 100);
  });

  it('should run down function continuously when down', function (done) {
    var g = this.g = new Game();
    var up = 0;
    var down = 0;
    g.Person.prototype.controls = {
      'A': {
        down: function() { down++; },
        up: function() { up++; }
      }
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
    g.c.inputter._buttonListener._down(g.c.inputter.A);
    setTimeout(function() {
      g.c.ticker.stop();
      down.should.be.greaterThan(1);
      up.should.equal(0);
      done();
    }, 100);
  });

  it('should run up function continuously when up', function (done) {
    var g = this.g = new Game();
    var up = 0;
    var down = 0;
    g.Person.prototype.controls = {
      'A': {
        down: function() { down++; },
        up: function() { up++; }
      }
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
    setTimeout(function() {
      up.should.be.greaterThan(1);
      down.should.equal(0);
      done();
    }, 100);
  });

  it('should run pressed function once when down', function (done) {
    var g = this.g = new Game();
    var times = 0;
    g.Person.prototype.controls = {
      'A': {
        pressed: function() { times++; }
      }
    };
    var ticks = 0;
    var update = g.Person.prototype.update;
    g.Person.prototype.update = function () {
      ticks++;
      update.apply(this);
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
    g.c.inputter._buttonListener._down(g.c.inputter.A);
    setTimeout(function() {
      times.should.equal(1);
      ticks.should.be.greaterThan(1);
      done();
    }, 100);
  });
});

describe('Color Tutorial', function(){
  afterEach(function() {
    this.g.c.ticker.stop(); // stop the current game instance
  });

  it('should draw Person with alive config when alive', function (done) {
    var g = this.g = new Game();
    g.Person.prototype.draw = function() {
      this.color.should.equal('#00BEEF');
      done();
    };
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 1,
      player: {
        colors: { alive: '#00BEEF', dead: '#00DEAD' }
      }
    });
  });

  it('should draw Person with dead config when dead', function (done) {
    var g = this.g = new Game();
    g.Person.prototype.draw = function() {
      this.color.should.equal('#00DEAD');
      done();
    };
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 1,
      player: {
        colors: { alive: '#00BEEF', dead: '#00DEAD' }
      }
    });
    g.c.entities.all(g.Person).forEach(function(person) {
      person.collision();
    });
  });

  it('should draw Robot with alive config when alive', function (done) {
    var g = this.g = new Game();
    g.Robot.prototype.draw = function() {
      this.color.should.equal('#00BEEF');
      done();
    };
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 1,
      robot: {
        colors: { alive: '#00BEEF', dead: '#00DEAD' }
      }
    });
  });

  it('should draw Robot with dead config when dead', function (done) {
    var g = this.g = new Game();
    g.Robot.prototype.draw = function() {
      this.color.should.equal('#00DEAD');
      done();
    };
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 2,
      robot: {
        colors: { alive: '#00BEEF', dead: '#00DEAD' }
      }
    });
    var robots = g.c.entities.all(g.Robot);
    robots[0].collision(robots[1]);
    robots[1].collision(robots[0]);
  });

  it('should use configured background color', function () {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "fuchsia", 
      enemies: 0
    });
    g.c.renderer._backgroundColor.should.equal('fuchsia'); 
  });
});

describe('Graphics Tutorial', function() {
  afterEach(function() {
    this.g.c.ticker.stop(); // stop the current game instance
  });

  it('should put arbitrary player config on Person', function() {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 2,
      player: {
        arbitrary: 'config'
      }
    });
    g.c.entities.all(g.Person).forEach(function(entity) {
      entity.should.have.property('arbitrary');
      entity.arbitrary.should.equal('config');
    });
  });

  it('should put arbitrary robot config on all Robots', function() {
    var g = this.g = new Game();
    g.start({
      width: 100, 
      height: 100, 
      background: "black", 
      enemies: 2,
      robot: {
        arbitrary: 'config'
      }
    });
    var robots = g.c.entities.all(g.Robot);
    robots.length.should.equal(2);
    robots.forEach(function(entity) {
      entity.should.have.property('arbitrary');
      entity.arbitrary.should.equal('config');
    });
  });

  it('should use overwritten draw', function(done) {
    var g = this.g = new Game();
    g.Base.prototype.draw = function (ctx) {
      done();
    };
    g.start({width: 100, height: 100, background: "black", enemies: 1});
  });
});
