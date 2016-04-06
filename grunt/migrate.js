'use strict';

var fs = require('fs');
var xml2js = require('xml2js');
var util = require('util');
var Q = require('q');
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

  function _findPart(group, id) {
    if (group instanceof Array) {
      for (var i = 0; i < group.length; i++) {
        var part = _findPart(group[i], id);

        if (part !== false) {
          return part;
        }
      }
    }

    if (group.type === 'group') {
      return _findPart(group.parts, id);
    }

    return group.id === id ? group : false;
  }

  function findPart(id) {
    return _findPart(bins, id);
  }

  function updatePart(part, data) {
    part.connectors = data.module.connectors[0].connector; // TODO: Preprocess connectors data
    part.tags = data.module.tags[0].tag;
    part.title = data.module.title[0];
    part.views = {
      breadboard: data.module.views[0].breadboardView[0].layers[0].$.image.split('/').pop(),
      icon: data.module.views[0].iconView[0].layers[0].$.image.split('/').pop()
    };

    if (data.module.description !== undefined) {
      part.description = data.module.description[0];
    }
  }

  function loadPart(path) {
    var parser = new xml2js.Parser();
    var deferred = Q.defer();

    fs.readFile(path, function (err, data) {
      parser.parseString(data, function (err, result) {
        // Skip files with parse erros
        if (err !== null) {
          error(path + ': ' + err);

          deferred.resolve();

          return deferred.promise;
        }

        var part = findPart(result.module.$.moduleId);

        // Skip unreferenced modules
        if (part === false) {
          error(path + ': Reference not found: ' + result.module.$.moduleId);

          deferred.resolve();

          return deferred.promise;
        }

        part.source = path;

        updatePart(part, result);

        deferred.resolve();
      });
    });

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
