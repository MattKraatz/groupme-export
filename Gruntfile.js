module.exports = function(grunt) {
  // Load grunt plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-stylelint');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-htmlhint');

  // Plugin configuration
  grunt.initConfig({
    jshint: {
      all: {
        src: ['./**/*.js', '!./node_modules/**/*', '!./bower_components/**/*', '!./Gruntfile.js'],
        options: {
          jshintrc: true
        }
      }
    },
    stylelint: {
      all: {
        src: ['./**/*.css', '!./node_modules/**/*', '!./bower_components/**/*']
      }
    },
    watch: {
      options: {
        livereload: true
      },
      js: {
        files: ['./**/*.js', '!./node_modules/**/*', '!./bower_components/**/*'],
        tasks: ['jshint']
      },
      html: {
        files: ['./**/*.html', '!./node_modules/**/*', '!./bower_components/**/*'],
        tasks: ['htmlhint']
      },
      css: {
        files: ['./**/*.css', '!./node_modules/**/*', '!./bower_components/**/*'],
        tasks: ['stylelint']
      },
      json: {
        files: ['./**/*.json', '!./node_modules/**/*', '!./bower_components/**/*'],
        tasks: ['jsonlint']
      }
    },
    jsonlint: {
      all: {
        src: ['./**/*.json', '!./node_modules/**/*', '!./bower_components/**/*'],
        options: {
          format: true,
          indent: 2
        }
      }
    },
    htmlhint: {
      all: {
        src: ['./**/*.html', '!./node_modules/**/*', '!./bower_components/**/*'],
        options: {
          htmlhintrc: '.htmlhintrc'
        }
      }
    }
  });

};
