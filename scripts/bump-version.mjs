import fs from 'node:fs';
import path from 'node:path';

const bumpType = process.argv[2];

if (bumpType !== 'minor' && bumpType !== 'major') {
  console.error('Usage: node scripts/bump-version.mjs <minor|major>');
  process.exit(1);
}

const rootPath = process.cwd();
const packageJsonPath = path.join(rootPath, 'package.json');
const packageLockPath = path.join(rootPath, 'package-lock.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version ?? '');

if (!versionMatch) {
  console.error(`Unsupported version format: ${packageJson.version ?? '<missing>'}`);
  process.exit(1);
}

const currentMajor = Number.parseInt(versionMatch[1], 10);
const currentMinor = Number.parseInt(versionMatch[2], 10);
const currentPatch = Number.parseInt(versionMatch[3], 10);

const nextVersion = bumpType === 'major'
  ? `${currentMajor + 1}.0.0`
  : `${currentMajor}.${currentMinor + 1}.0`;

packageJson.version = nextVersion;

if (packageLock.version) {
  packageLock.version = nextVersion;
}

if (packageLock.packages && packageLock.packages['']) {
  packageLock.packages[''].version = nextVersion;
}

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

console.log(nextVersion);
