var express = require('express');
var compile = require('./compile');

var PORT = process.env.PORT || 3000;

var app = express();

app.use(function(req, res, next) {
  var file = req.path;
  if (file.substr(-1) === '/') file += "index.html";
  file = file.substr(1);
  if (compile.TARGET_FILES.indexOf(file) !== -1) compile(file);
  next();
});

app.use(express.static(__dirname + '/..'));

app.listen(PORT, function(){
  console.log('listening on port ' + PORT);
});
