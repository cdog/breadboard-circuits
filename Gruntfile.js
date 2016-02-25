module.exports = function (grunt) {
  'use strict';

  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control',
    htmllint: 'grunt-html'
  });

  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      core: {
        options: {
          outputSourceFiles: true,
          sourceMap: true,
          sourceMapFilename: 'html/assets/app/css/style.css.map',
          sourceMapURL: 'style.css.map',
          strictMath: true
        },
        files: {
          'html/assets/app/css/style.css': 'less/style.less'
        }
      }
    }
  });
};
