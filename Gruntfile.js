module.exports = function (grunt) {
  'use strict';

  const { execFileSync } = require('node:child_process');
  const fs = require('node:fs');
  const path = require('node:path');
  const pug = require('pug');
  const sass = require('sass');
  const cssSourcePath = path.join(__dirname, 'assets', 'scss', 'index.scss');
  const cssOutputPath = path.join(__dirname, 'assets', 'css', 'index.css');
  const cssMapPath = path.join(__dirname, 'assets', 'css', 'index.css.map');
  const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');

  grunt.initConfig({
    cssmin: {
      prod: {
        files: {
          'assets/css/index.min.css': ['assets/css/index.css']
        }
      }
    },
    uglify: {
      prod: {
        files: {
          'assets/js/index.min.js': ['assets/js/index.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  function buildHtml(cssHref, jsHref) {
    const sourcePath = path.join(__dirname, 'template', 'index.jade');
    const outputPath = path.join(__dirname, 'template', 'index.html');
    const html = pug.renderFile(sourcePath, {
      cssHref,
      filename: sourcePath,
      jsHref,
      pretty: true
    });

    fs.writeFileSync(outputPath, html, 'utf8');
  }

  grunt.registerTask('html:dev', 'Build template/index.html for development.', function () {
    buildHtml('../assets/css/index.css', '../assets/js/index.js');
  });

  grunt.registerTask('html:prod', 'Build template/index.html for production.', function () {
    buildHtml('../assets/css/index.min.css', '../assets/js/index.min.js');
  });

  grunt.registerTask('styles:dev', 'Build the frontend SCSS bundle with source maps.', function () {
    const result = sass.compile(cssSourcePath, {
      charset: true,
      sourceMap: true,
      sourceMapIncludeSources: true,
      style: 'expanded'
    });

    fs.writeFileSync(cssOutputPath, `${result.css}\n/*# sourceMappingURL=index.css.map */\n`, 'utf8');
    fs.writeFileSync(cssMapPath, JSON.stringify(result.sourceMap, null, 2), 'utf8');
  });

  grunt.registerTask('styles:prod', 'Build the frontend SCSS bundle without source maps.', function () {
    const result = sass.compile(cssSourcePath, {
      charset: true,
      style: 'expanded'
    });

    fs.writeFileSync(cssOutputPath, result.css, 'utf8');

    if (fs.existsSync(cssMapPath)) {
      fs.unlinkSync(cssMapPath);
    }
  });

  grunt.registerTask('typescript:dev', 'Build the frontend TypeScript bundle with source maps.', function () {
    execFileSync(process.execPath, [tscPath, '--project', 'tsconfig.json', '--sourceMap', 'true'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
  });

  grunt.registerTask('typescript:prod', 'Build the frontend TypeScript bundle without source maps.', function () {
    execFileSync(process.execPath, [tscPath, '--project', 'tsconfig.json', '--sourceMap', 'false'], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    const jsMapPath = path.join(__dirname, 'assets', 'js', 'index.js.map');

    if (fs.existsSync(jsMapPath)) {
      fs.unlinkSync(jsMapPath);
    }
  });

  grunt.registerTask('dev', ['styles:dev', 'typescript:dev', 'html:dev']);
  grunt.registerTask('prod', ['styles:prod', 'typescript:prod', 'cssmin:prod', 'uglify:prod', 'html:prod']);
  grunt.registerTask('build', ['dev']);
  grunt.registerTask('default', ['dev']);
};
