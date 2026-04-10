'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const cleanCss = require('gulp-clean-css');
const esbuild = require('esbuild');
const gulp = require('gulp');
const pug = require('pug');
const sass = require('sass');
const uglify = require('gulp-uglify');

const cssSourcePath = path.join(__dirname, 'assets', 'scss', 'index.scss');
const cssOutputPath = path.join(__dirname, 'assets', 'css', 'index.css');
const cssMapPath = path.join(__dirname, 'assets', 'css', 'index.css.map');
const clientOutputPath = path.join(__dirname, 'assets', 'js');
const clientBundlePath = path.join(clientOutputPath, 'index.js');
const playwrightUatPath = path.join(__dirname, 'test', 'uat-cross-browser.js');
const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');

/**
 * Ensures a directory exists before writing generated output.
 *
 * @param {string} directoryPath - Directory path to create when missing.
 * @returns {void}
 */
function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

/**
 * Removes previous generated client JavaScript before bundling.
 *
 * @returns {void}
 */
function cleanClientBuildArtifacts() {
  ensureDirectory(clientOutputPath);

  fs.readdirSync(clientOutputPath).forEach((entry) => {
    if (/\.js(\.map)?$/.test(entry)) {
      fs.unlinkSync(path.join(clientOutputPath, entry));
    }
  });
}

/**
 * Renders the Jade entrypoint into the generated HTML file.
 *
 * @param {string} cssHref - Stylesheet href to inject into the template.
 * @param {string} jsHref - Script href to inject into the template.
 * @returns {void}
 */
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

/**
 * Builds development HTML with unminified asset references.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function htmlDev(done) {
  buildHtml('../assets/css/index.css', '../assets/js/index.js');
  done();
}

/**
 * Builds production HTML with minified asset references.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function htmlProd(done) {
  buildHtml('../assets/css/index.min.css', '../assets/js/index.min.js');
  done();
}

/**
 * Builds development CSS and writes a source map.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function stylesDev(done) {
  const result = sass.compile(cssSourcePath, {
    charset: true,
    sourceMap: true,
    sourceMapIncludeSources: true,
    style: 'expanded'
  });

  ensureDirectory(path.dirname(cssOutputPath));
  fs.writeFileSync(cssOutputPath, `${result.css}\n/*# sourceMappingURL=index.css.map */\n`, 'utf8');
  fs.writeFileSync(cssMapPath, JSON.stringify(result.sourceMap, null, 2), 'utf8');
  done();
}

/**
 * Builds production CSS without source maps.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function stylesProd(done) {
  const result = sass.compile(cssSourcePath, {
    charset: true,
    style: 'expanded'
  });

  ensureDirectory(path.dirname(cssOutputPath));
  fs.writeFileSync(cssOutputPath, result.css, 'utf8');

  if (fs.existsSync(cssMapPath)) {
    fs.unlinkSync(cssMapPath);
  }

  done();
}

/**
 * Type-checks and bundles the modular client TypeScript for browsers.
 *
 * @param {boolean} sourceMap - Whether to emit a client source map.
 * @returns {void}
 */
function buildClient(sourceMap) {
  cleanClientBuildArtifacts();
  execFileSync(process.execPath, [tscPath, '--project', 'tsconfig.json', '--noEmit', 'true'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  esbuild.buildSync({
    bundle: true,
    entryPoints: [path.join(__dirname, 'src', 'client', 'index.ts')],
    format: 'iife',
    outfile: clientBundlePath,
    platform: 'browser',
    sourcemap: sourceMap,
    target: 'es2022'
  });
}

/**
 * Builds development client JavaScript with a source map.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function clientDev(done) {
  buildClient(true);
  done();
}

/**
 * Builds production client JavaScript without a source map.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function clientProd(done) {
  buildClient(false);
  done();
}

/**
 * Compiles the service TypeScript project.
 *
 * @param {boolean} sourceMap - Whether to emit service source maps.
 * @returns {void}
 */
function buildService(sourceMap) {
  execFileSync(process.execPath, [tscPath, '--project', 'tsconfig.server.json', '--sourceMap', String(sourceMap)], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  if (!sourceMap) {
    const serviceMapPaths = [
      path.join(__dirname, 'src', 'service', 'app.js.map'),
      path.join(__dirname, 'src', 'service', 'index.js.map')
    ];

    serviceMapPaths.forEach((mapPath) => {
      if (fs.existsSync(mapPath)) {
        fs.unlinkSync(mapPath);
      }
    });
  }
}

/**
 * Builds development service JavaScript with source maps.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function serviceDev(done) {
  buildService(true);
  done();
}

/**
 * Builds production service JavaScript without source maps.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function serviceProd(done) {
  buildService(false);
  done();
}

/**
 * Minifies the generated CSS bundle for production.
 *
 * @returns {NodeJS.ReadWriteStream} Gulp stream for the minification task.
 */
function cssMin() {
  return gulp.src('assets/css/index.css')
    .pipe(cleanCss())
    .pipe(require('gulp-rename')('index.min.css'))
    .pipe(gulp.dest('assets/css'));
}

/**
 * Minifies the generated JavaScript bundle for production.
 *
 * @returns {NodeJS.ReadWriteStream} Gulp stream for the minification task.
 */
function jsMin() {
  return gulp.src('assets/js/index.js')
    .pipe(uglify())
    .pipe(require('gulp-rename')('index.min.js'))
    .pipe(gulp.dest('assets/js'));
}

/**
 * Runs the cross-browser and responsive UAT suite.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function uat(done) {
  execFileSync(process.execPath, [playwrightUatPath], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  done();
}

const dev = gulp.series(stylesDev, clientDev, serviceDev, htmlDev);
const prod = gulp.series(stylesProd, clientProd, serviceProd, gulp.parallel(cssMin, jsMin), htmlProd);

exports['html:dev'] = htmlDev;
exports['html:prod'] = htmlProd;
exports['styles:dev'] = stylesDev;
exports['styles:prod'] = stylesProd;
exports['typescript:dev'] = clientDev;
exports['typescript:prod'] = clientProd;
exports['service:dev'] = serviceDev;
exports['service:prod'] = serviceProd;
exports['server:dev'] = serviceDev;
exports['server:prod'] = serviceProd;
exports.uat = uat;
exports.dev = dev;
exports.prod = prod;
exports.build = dev;
exports.default = dev;
