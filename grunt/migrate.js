'use strict';

var fs = require('fs-extra');
var Path = require('path');
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

  function readdir(path, recursive, extname) {
    var results = [];
    var files = fs.readdirSync(path);

    files.forEach(function(file) {
      file = path + '/' + file;

      var stat = fs.statSync(file);

      if (stat && stat.isDirectory()) {
        if (recursive) {
          results = results.concat(readdir(file, recursive, extname));
        }
      } else if (extname) {
        if (Path.extname(file) === extname) {
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
          icon: result.module.$.icon.toLowerCase(),
          parts: [],
          title: result.module.title[0],
          type: 'group'
        };

        var dirname = Path.dirname(path);
        var iconPath = dirname + '/' + result.module.$.icon;

        if (fs.existsSync(iconPath) === true) {
          var dest = options.dest + '/icons';

          fs.mkdirpSync(dest);
          fs.copySync(iconPath, dest + '/' + bin.icon);
        } else {
          error(path + ': File not found: ' + iconPath)

          delete bin.icon;
        }

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

    readdir(path, true, '.fzb').forEach(function (file) {
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
    part.properties = [];
    part.tags = data.module.tags[0].tag;
    part.title = data.module.title[0];
    part.views = {
      breadboard: Path.basename(data.module.views[0].breadboardView[0].layers[0].$.image).toLowerCase(),
      icon: Path.basename(data.module.views[0].iconView[0].layers[0].$.image).toLowerCase()
    };

    if (data.module.description !== undefined) {
      part.description = data.module.description[0];
    }

    if (data.module.label !== undefined) {
      part.label = data.module.label[0];
    }

    var properties = data.module.properties[0].property;

    for (var i = 0; i < properties.length; i++) {
      var property = {
        name: properties[i].$.name
      }

      if (properties[i]._ !== undefined) {
        property.value = properties[i]._;
      }

      if (properties[i].$.showInLabel !== undefined) {
        property.show = properties[i].$.showInLabel === 'yes';
      }

      part.properties.push(property);
    }
  }

  function copyPartFiles(path, part, data) {
    /* icons */
    var svgBasename = Path.basename(data.module.views[0].iconView[0].layers[0].$.image);

    var paths = readdir(options.src + '/svg/core/breadboard')
      .concat(readdir(options.src + '/svg/contrib/icon'))
      .concat(readdir(options.src + '/svg/contrib/breadboard'))
      .concat(readdir(options.src + '/svg/core/icon'));

    paths = paths.filter(function (path) {
      return Path.basename(path) === svgBasename;
    });

    if (paths.length !== 0) {
      var dest = options.dest + '/svg/icons';

      fs.mkdirpSync(dest);
      fs.copySync(paths[0], dest + '/' + part.views.icon);
    } else {
      error(path + ': File not found: ' + svgBasename);
    }

    /* breadboard */
    svgBasename = Path.basename(data.module.views[0].breadboardView[0].layers[0].$.image);

    paths = readdir(options.src + '/svg/core/breadboard')
      .concat(readdir(options.src + '/svg/contrib/breadboard'));

    paths = paths.filter(function (path) {
      return Path.basename(path) === svgBasename;
    });

    if (paths.length !== 0) {
      var dest = options.dest + '/svg/breadboard';

      fs.mkdirpSync(dest);
      fs.copySync(paths[0], dest + '/' + part.views.breadboard);
    } else {
      error(path + ': File not found: ' + svgBasename);
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

        part._source = path;

        updatePart(part, result);
        copyPartFiles(path, part, result);

        deferred.resolve();
      });
    });

    return deferred.promise;
  }

  function loadParts(path) {
    var deferred = Q.defer();
    var promises = [];

    readdir(path, false, '.fzp').forEach(function (file) {
      promises.push(loadPart(file));
    });

    Q.all(promises).then(function () {
      deferred.resolve();
    }).done();

    return deferred.promise;
  }

  function sanitizeParts() {
    // Delete unreferenced parts
    for (var bin of bins) {
      bin.parts = bin.parts.filter(function (part) {
        if (part.type === 'group') {
          part.parts = part.parts.filter(function (p) {
            if (p._source === undefined) {
              error(part.title + ': No source found: ' + p.id);

              return false;
            }

            delete part._source;

            return true;
          });

          return true;
        }

        if (part._source === undefined) {
          error(bin.title + ': No source found: ' + part.id);

          return false;
        }

        delete part._source;

        return true;
      });
    }

    // Delete empty groups
    for (var bin of bins) {
      bin.parts = bin.parts.filter(function (part) {
        if (part.type === 'group') {
          if (part.parts.length === 0) {
            log(bin.title + ': ' + part.title + ': Empty group');

            return false;
          }

          return true;
        }

        return true;
      });
    }

    // Delete empty bins
    bins = bins.filter(function (part) {
      if (part.type === 'group') {
        if (part.parts.length === 0) {
          log(part.title + ': Empty bin');

          return false;
        }

        return true;
      }

      return true;
    });
  }

  grunt.registerMultiTask('migrate', function () {
    options = this.data;

    var done = this.async();

    Q.fcall(loadBins, options.src + '/bins').then(function () {
      return loadParts(options.src + '/core');
    }).then(function () {
      sanitizeParts();

      inspect(util.inspect(bins, { depth: null }));

      // Write parts library to disk
      fs.mkdirpSync(options.dest);
      fs.writeFileSync(options.dest + '/parts.json', JSON.stringify(bins));
    }).then(function () {
      done();
    }).done();
  });
};
