'use strict';

var fs = require('fs');
var debug = require('debug');
var error = debug('migrate:error');
var inspect = debug('migrate:inspect');
var log = debug('migrate:log');

module.exports = function migrate(grunt) {
  var options = {};
  var bins = [];

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

  function loadBin(path) {
    var parser = new xml2js.Parser();
    var deferred = Q.defer();

    fs.readFile(path, function (err, data) {
      parser.parseString(data, function (err, result) {
        var bin = {
          parts: [],
          title: result.module.title,
          type: 'group'
        };

        var instances = result.module.instances[0].instance;
        var group;

        instances.forEach(function (instance) {
          if (instance.$.moduleIdRef === '__spacer__') {
            if (group !== undefined) {
              bin.parts.push(group);
            }

            group = {
              parts: [],
              title: instance.$.path,
              type: 'group'
            }
          } else {
            var part = {
              id: instance.$.moduleIdRef,
              type: 'part'
            }

            if (group !== undefined) {
              group.parts.push(part);
            } else {
              bin.parts.push(part);
            }
          }
        });

        bins.push(bin);

        deferred.resolve();
      });
    });

    return deferred.promise;
  }

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

  function loadParts(path) {
    var deferred = Q.defer();
    var promises = [];

    readdir(path, false, 'fzp').forEach(function (file) {
      promises.push(loadPart(file));
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
      return loadParts(options.src + '/core');
    }).then(function () {
      done();
    }).done();
  });
};
