'use strict';

var fs = require('fs');
var debug = require('debug');
var error = debug('migrate:error');
var inspect = debug('migrate:inspect');
var log = debug('migrate:log');

module.exports = function migrate(grunt) {
  var options = {};

  function readdir(path, recursive, ext) {
    var results = [];
    var files = fs.readdirSync(path);

    files.forEach(function(file) {
      file = path + '/' + file;

      var stat = fs.statSync(file);

      if (stat && stat.isDirectory()) {
        if (recursive) {
          results = results.concat(readdir(file, recursive, ext));
        }
      } else if (ext) {
        if (file.split('.').pop() === ext) {
          results.push(file);
        }
      } else {
        results.push(file)
      }
    });

    return results;
  };

  function loadBins(path) {
    var deferred = Q.defer();
    var promises = [];

    readdir(path, true, 'fzb').forEach(function (file) {
      promises.push(loadBin(file));
    });

    Q.all(promises).then(function () {
      deferred.resolve();
    }).done();

    return deferred.promise;
  }

  grunt.registerMultiTask('migrate', function () {
    options = this.data;

    var done = this.async();

    Q.fcall(loadBins, options.src + '/bins').then(function () {
      done();
    }).done();
  });
};
