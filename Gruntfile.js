module.exports = function (grunt) {
  'use strict';

  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control',
    migrate: 'grunt/migrate.js'
  });

  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    migrate: {
      parts: {
        dest: 'assets/app/parts',
        src: 'fritzing-parts'
      }
    },
    less: {
      core: {
        options: {
          outputSourceFiles: true,
          sourceMap: true,
          sourceMapFilename: 'dist/assets/app/css/style.css.map',
          sourceMapURL: 'style.css.map',
          strictMath: true
        },
        files: {
          'dist/assets/app/css/style.css': 'less/style.less'
        }
      }
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')
        ]
      },
      core: {
        src: 'dist/assets/app/css/*.css'
      }
    },
    csscomb: {
      options: {
        config: 'less/.csscomb.json'
      },
      core: {
        src: 'dist/assets/app/css/style.css',
        dest: 'dist/assets/app/css/style.css'
      }
    },
    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      core: {
        src: 'dist/assets/app/css/style.css'
      }
    },
    cssmin: {
      options: {
        advanced: false,
        keepSpecialComments: '*',
        sourceMap: true
      },
      core: {
        expand: true,
        cwd: 'dist/assets/app/css',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/assets/app/css',
        ext: '.min.css'
      }
    },
    eslint: {
      options: {
        configFile: 'js/.eslintrc'
      },
      target: 'js/*.js'
    },
    jscs: {
      options: {
        config: 'js/.jscsrc'
      },
      grunt: {
        src: 'Gruntfile.js'
      },
      core: {
        src: 'js/*.js'
      }
    },
    concat: {
      core: {
        src: [
          'js/wyliodrin.js',
          'js/load.js',
          'js/main.js'
        ],
        dest: 'dist/assets/app/js/application.js'
      }
    },
    uglify: {
      options: {
        compress: {
          warnings: false
        },
        preserveComments: 'some'
      },
      core: {
        src: '<%= concat.core.dest %>',
        dest: 'dist/assets/app/js/application.min.js'
      }
    },
    copy: {
      assets: {
        expand: true,
        src: 'assets/**',
        dest: 'dist'
      },
      packages: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/angular',
            src: '*',
            dest: 'dist/assets/vendor/angular'
          },
          {
            expand: true,
            cwd: 'node_modules/angular-animate',
            src: '*',
            dest: 'dist/assets/vendor/angular-animate'
          },
          {
            expand: true,
            cwd: 'node_modules/angular-aria',
            src: '*',
            dest: 'dist/assets/vendor/angular-aria'
          },
          {
            expand: true,
            cwd: 'node_modules/angular-material',
            src: '*',
            dest: 'dist/assets/vendor/angular-material'
          },
          {
            expand: true,
            cwd: 'node_modules/angular-messages',
            src: '*',
            dest: 'dist/assets/vendor/angular-messages'
          },
          {
            expand: true,
            cwd: 'node_modules/d3',
            src: ['d3.js', 'd3.min.js'],
            dest: 'dist/assets/vendor/d3'
          },
          {
            expand: true,
            cwd: 'node_modules/handlebars/dist',
            src: '*',
            dest: 'dist/assets/vendor/handlebars'
          },
          {
            expand: true,
            cwd: 'node_modules/jquery/dist',
            src: '*',
            dest: 'dist/assets/vendor/jquery'
          },
          {
            expand: true,
            cwd: 'node_modules/nprogress',
            src: ['nprogress.css', 'nprogress.js'],
            dest: 'dist/assets/vendor/nprogress'
          }
        ]
      }
    },
    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          minifyCSS: true,
          minifyJS: true,
          removeAttributeQuotes: true,
          removeComments: true
        },
        expand: true,
        cwd: 'html',
        src: '**/*.html',
        dest: 'dist'
      }
    },
    watch: {
      configFiles: {
        options: {
          reload: true
        },
        files: ['Gruntfile.js', 'package.json']
      },
      html: {
        files: 'html/**/*.html',
        tasks: 'html'
      },
      js: {
        files: 'js/*.js',
        tasks: 'js'
      },
      less: {
        files: 'less/**/*.less',
        tasks: 'css'
      }
    },
    buildcontrol: {
      options: {
        commit: true,
        push: true
      },
      pages: {
        options: {
          remote: 'git@github.com:cdog/breadboard-circuits.git',
          branch: 'gh-pages'
        }
      }
    },
    clean: {
      options: {
        force: true
      },
      dist: 'dist'
    }
  });

  grunt.registerTask('assets', 'copy');
  grunt.registerTask('css', ['less', 'postcss', 'csscomb', 'csslint', 'cssmin']);
  grunt.registerTask('js', ['eslint', 'jscs', 'concat', 'uglify']);
  grunt.registerTask('html', 'htmlmin');

  grunt.registerTask('build', ['assets', 'css', 'js', 'html']);
  grunt.registerTask('deploy', 'buildcontrol');

  grunt.registerTask('default', 'build');
};
