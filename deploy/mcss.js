var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mcss = require('mcss');

var translateMcss = function (filename) {
  var instance = mcss({
    filename: filename
  });
  var basename = path.basename(filename, '.mcss');
  if (basename.indexOf('_') === 0) {
    return;
  }
  instance.translate().done(function (text) {
    var file = path.dirname(filename) + '/' + basename + '.css';
    console.log('output mcss: %s', file);
    fs.writeFileSync(file, text);
  }).fail(function (error) {
    console.log('%s compile failed: %s', filename, error);
  });
}
glob(__dirname + '/../public/src/**/*.mcss', function (er, files) {
  files.forEach(translateMcss)
});
