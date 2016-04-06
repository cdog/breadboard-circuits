'use strict';

module.exports = function migrate(grunt) {
  var options = {};

  grunt.registerMultiTask('migrate', function () {
    options = this.data;
  });
};
