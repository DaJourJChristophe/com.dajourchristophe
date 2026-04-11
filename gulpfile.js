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

const buildRootPath = path.join(__dirname, 'build');
const buildClientPath = path.join(buildRootPath, 'client');
const buildClientAssetsPath = path.join(buildClientPath, 'assets');
const buildServicePath = path.join(buildRootPath, 'service');
const buildTestPath = path.join(buildRootPath, 'test');
const buildUatPath = path.join(buildTestPath, 'uat');
const cssSourcePath = path.join(__dirname, 'assets', 'scss', 'index.scss');
const cssOutputPath = path.join(buildClientAssetsPath, 'css', 'index.css');
const cssMapPath = path.join(buildClientAssetsPath, 'css', 'index.css.map');
const clientOutputPath = path.join(buildClientAssetsPath, 'js');
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
 * Removes a directory when it already exists.
 *
 * @param {string} directoryPath - Directory path to remove.
 * @returns {void}
 */
function resetDirectory(directoryPath) {
  fs.rmSync(directoryPath, { force: true, recursive: true });
  ensureDirectory(directoryPath);
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
 * Copies source static images into the generated client asset tree.
 *
 * @returns {void}
 */
function copyStaticAssets() {
  const sourceAssetPath = path.join(__dirname, 'assets', 'img');
  const outputAssetPath = path.join(buildClientAssetsPath, 'img');

  fs.cpSync(sourceAssetPath, outputAssetPath, { force: true, recursive: true });
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
  const outputPath = path.join(buildClientPath, 'index.html');
  const html = pug.renderFile(sourcePath, {
    cssHref,
    filename: sourcePath,
    jsHref,
    pretty: true
  });

  ensureDirectory(path.dirname(outputPath));
  fs.writeFileSync(outputPath, html, 'utf8');
}

/**
 * Builds development HTML with unminified asset references.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function htmlDev(done) {
  buildHtml('./assets/css/index.css', './assets/js/index.js');
  done();
}

/**
 * Builds production HTML with minified asset references.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function htmlProd(done) {
  buildHtml('./assets/css/index.min.css', './assets/js/index.min.js');
  done();
}

/**
 * Builds development CSS and writes a source map.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function stylesDev(done) {
  copyStaticAssets();
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
  copyStaticAssets();
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
  resetDirectory(buildServicePath);
  execFileSync(process.execPath, [tscPath, '--project', 'tsconfig.server.json', '--sourceMap', String(sourceMap)], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  if (!sourceMap) {
    const serviceMapPaths = [
      path.join(buildServicePath, 'app.js.map'),
      path.join(buildServicePath, 'index.js.map')
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
  return gulp.src(path.join(buildClientAssetsPath, 'css', 'index.css'))
    .pipe(cleanCss())
    .pipe(require('gulp-rename')('index.min.css'))
    .pipe(gulp.dest(path.join(buildClientAssetsPath, 'css')));
}

/**
 * Minifies the generated JavaScript bundle for production.
 *
 * @returns {NodeJS.ReadWriteStream} Gulp stream for the minification task.
 */
function jsMin() {
  return gulp.src(path.join(buildClientAssetsPath, 'js', 'index.js'))
    .pipe(uglify())
    .pipe(require('gulp-rename')('index.min.js'))
    .pipe(gulp.dest(path.join(buildClientAssetsPath, 'js')));
}

/**
 * Runs the cross-browser and responsive UAT suite.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function uat(done) {
  ensureDirectory(buildUatPath);
  execFileSync(process.execPath, [playwrightUatPath], {
    cwd: __dirname,
    env: {
      ...process.env,
      UAT_OUTPUT_DIR: buildUatPath
    },
    stdio: 'inherit'
  });
  done();
}

const dev = gulp.series(stylesDev, clientDev, serviceDev, htmlDev);
const prod = gulp.series(stylesProd, clientProd, serviceProd, gulp.parallel(cssMin, jsMin), htmlProd);

/**
 * Watches SCSS sources and rebuilds development CSS on change.
 *
 * @returns {FSWatcher} Active Gulp watcher instance.
 */
function watchStyles() {
  return gulp.watch('assets/scss/**/*.scss', stylesDev);
}

/**
 * Watches client TypeScript sources and rebuilds the browser bundle on change.
 *
 * @returns {FSWatcher} Active Gulp watcher instance.
 */
function watchClient() {
  return gulp.watch('src/client/**/*.ts', clientDev);
}

/**
 * Watches service TypeScript sources and rebuilds the loopback service on change.
 *
 * @returns {FSWatcher} Active Gulp watcher instance.
 */
function watchService() {
  return gulp.watch('src/service/**/*.ts', serviceDev);
}

/**
 * Watches Jade/Pug sources and regenerates development HTML on change.
 *
 * @returns {FSWatcher} Active Gulp watcher instance.
 */
function watchHtml() {
  return gulp.watch(['template/index.jade', 'template/partials/**/*.pug'], htmlDev);
}

/**
 * Starts the development build and keeps file watchers active.
 *
 * @param {Function} done - Gulp completion callback.
 * @returns {void}
 */
function watch(done) {
  watchStyles();
  watchClient();
  watchService();
  watchHtml();
  done();
}

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
exports.watch = gulp.series(dev, watch);
exports.dev = dev;
exports.prod = prod;
exports.build = dev;
exports.default = dev;
