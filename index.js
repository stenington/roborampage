var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('.'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

var leader;
io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  socket.on('disconnect', function(){
    console.log('user disconnected', socket.id);
    if (socket.id === leader) leader = undefined;
    socket.broadcast.emit('remove player', socket.id);
  });

  socket.on('handshake', function(cb) {
    if (!leader) {
      leader = socket.id;
      cb('leader', socket.id);
    }
    else {
      cb('follower', socket.id);
    }
  });

  socket.on('update player', function(msg){
    msg.id = socket.id;
    socket.broadcast.emit('update player', msg);
  });
  socket.on('update robot', function(msg){
    socket.broadcast.emit('update robot', msg);
  });
  socket.on('dead', function(msg){
    msg.id = socket.id;
    socket.broadcast.emit('dead', msg);
  });
  socket.on('win', function(msg){
    socket.broadcast.emit('win', msg);
  });
  socket.on('lose', function(msg){
    socket.broadcast.emit('lose', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});