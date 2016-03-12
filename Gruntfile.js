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
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')
        ]
      },
      core: {
        src: 'html/assets/app/css/*.css'
      }
    },
    csscomb: {
      options: {
        config: 'less/.csscomb.json'
      },
      core: {
        src: 'html/assets/app/css/style.css',
        dest: 'html/assets/app/css/style.css'
      }
    },
    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      core: {
        src: 'html/assets/app/css/style.css'
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
        cwd: 'html/assets/app/css',
        src: ['*.css', '!*.min.css'],
        dest: 'html/assets/app/css',
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
          'js/main.js'
        ],
        dest: 'html/assets/app/js/application.js'
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
        dest: 'html/assets/app/js/application.min.js'
      }
    },
    copy: {
      assets: {
        expand: true,
        src: 'assets/**',
        dest: 'html'
      },
      packages: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/ace-builds',
            src: ['src/*', 'src-min/*', 'src-min-noconflict/*', 'src-noconflict/*'],
            dest: 'html/assets/vendor/ace'
          },
          {
            expand: true,
            cwd: 'node_modules/bootstrap/dist',
            src: '**',
            dest: 'html/assets/vendor/bootstrap'
          },
          {
            expand: true,
            cwd: 'node_modules/d3',
            src: ['d3.js', 'd3.min.js'],
            dest: 'html/assets/vendor/d3'
          },
          {
            expand: true,
            cwd: 'node_modules/jquery/dist',
            src: '*',
            dest: 'html/assets/vendor/jquery'
          }
        ]
      }
    },
    env: {
      build: {
        JEKYLL_ENV: grunt.option('environment') || 'development'
      }
    },
    jekyll: {
      options: {
        config: '_config.yml'
      },
      build: {},
      serve: {
        options: {
          incremental: true,
          serve: true
        }
      },
      watch: {
        options: {
          incremental: true,
          watch: true
        }
      }
    },
    htmllint: {
      src: 'dist/**/*.html'
    },
    _htmlmin: {
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
        cwd: 'dist',
        src: '**/*.html',
        dest: 'dist'
      }
    },
    _watch: {
      configFiles: {
        options: {
          reload: true
        },
        files: ['Gruntfile.js', 'package.json']
      },
      assets: {
        files: 'assets/**',
        tasks: 'copy:assets'
      },
      html: {
        files: 'dist/**/*.html',
        tasks: ['htmllint', 'htmlmin']
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
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      watch: ['_watch', 'jekyll:watch'],
      serve: ['_watch', 'jekyll:serve']
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
      assets: 'html/assets',
      dist: 'dist'
    }
  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.renameTask('htmlmin', '_htmlmin');

  grunt.registerTask('htmlmin', function () {
    // grunt.task.requires('env');

    if (process.env.JEKYLL_ENV === 'production') {
      grunt.task.run('_htmlmin');
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.renameTask('watch', '_watch');

  grunt.registerTask('watch', ['env', 'concurrent:watch']);
  grunt.registerTask('serve', ['env', 'concurrent:serve']);

  grunt.registerTask('assets', 'copy');
  grunt.registerTask('css', ['less', 'postcss', 'csscomb', 'csslint', 'cssmin']);
  grunt.registerTask('js', [/*'eslint', */'jscs', 'concat', 'uglify']);
  grunt.registerTask('html', ['jekyll:build', 'htmllint', 'htmlmin']);

  grunt.registerTask('build', ['env', 'assets', 'css', 'js', 'html']);
  grunt.registerTask('test', ['clean', 'build']);
  grunt.registerTask('deploy', 'buildcontrol');

  grunt.registerTask('default', 'build');
};
