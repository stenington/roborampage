var nunjucks = require('nunjucks');
var glob = require('glob');
var fs = require('fs');

var CONFIG = {
  thimble: {
    mainId: 59304,
    colorId: 59570,
    graphicsId: 59702
  }
};

var TARGET_FILES = ([
  'index.tmpl',
  'what.tmpl',
  'copypaste.tmpl',
  'hacks/**/index.tmpl',
  'hacks/**/tutorial.tmpl',
  'hacks/**/local.tmpl',
  'hacks/**/copypaste.tmpl'
]).reduce(function(prev, curr) {
  var files = glob.sync(curr);
  if (!files.length) console.warn('No files found for glob:', curr);
  return prev.concat(files);
}, []).map(function(template) {
  return template.replace(/tmpl$/, 'html');
});

function compile() {
  var targets = Array.prototype.slice.apply(arguments);
  targets.forEach(function(target) {
    var template = target.replace(/html$/, 'tmpl');
    console.log('Compiling', target);
    var html = (new nunjucks.Environment(new nunjucks.FileSystemLoader('.', true))).render(template, CONFIG);
    fs.writeFileSync(target, html);
  });
}

module.exports = compile;
module.exports.TARGET_FILES = TARGET_FILES;

if (!module.parent) {
  compile.apply(null, TARGET_FILES);
}