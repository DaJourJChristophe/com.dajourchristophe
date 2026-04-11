'use strict';

const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootPath = path.resolve(__dirname, '..');
const serviceEntryPath = path.join(rootPath, 'build', 'service', 'index.js');
const gulpCliPath = path.join(rootPath, 'node_modules', 'gulp', 'bin', 'gulp.js');

/**
 * Spawns a long-running child process and forwards stdio to the terminal.
 *
 * @param {string} command - Executable to launch.
 * @param {string[]} args - Command arguments.
 * @returns {import('node:child_process').ChildProcess} Running child process.
 */
function spawnChild(command, args) {
  return spawn(command, args, {
    cwd: rootPath,
    shell: false,
    stdio: 'inherit'
  });
}

/**
 * Runs the initial development build and exits on failure.
 *
 * @returns {void}
 */
function runInitialBuild() {
  const buildResult = spawnSync(process.execPath, [gulpCliPath, '--gulpfile', './gulpfile.js', 'dev'], {
    cwd: rootPath,
    shell: false,
    stdio: 'inherit'
  });

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }
}

runInitialBuild();

if (!fs.existsSync(serviceEntryPath)) {
  console.error(`Expected generated service entrypoint at ${serviceEntryPath}`);
  process.exit(1);
}

const watchProcess = spawnChild(process.execPath, [gulpCliPath, '--gulpfile', './gulpfile.js', 'watch']);
const serviceProcess = spawnChild(process.execPath, ['--watch', serviceEntryPath]);

/**
 * Stops both child processes and exits this launcher.
 *
 * @param {NodeJS.Signals} signal - Signal received by the parent process.
 * @returns {void}
 */
function shutdown(signal) {
  watchProcess.kill(signal);
  serviceProcess.kill(signal);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

watchProcess.on('exit', (code) => {
  if (code && code !== 0) {
    serviceProcess.kill('SIGTERM');
    process.exit(code);
  }
});

serviceProcess.on('exit', (code) => {
  if (code && code !== 0) {
    watchProcess.kill('SIGTERM');
    process.exit(code);
  }
});
