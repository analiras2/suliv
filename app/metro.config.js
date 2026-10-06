// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const repositoryRoot = path.resolve(projectRoot, '..');
const sharedPackagesRoot = path.resolve(repositoryRoot, 'packages');

const config = getDefaultConfig(projectRoot);

// `@suliv/error-codes` is installed as a `file:` dependency, so npm symlinks it
// into node_modules from outside the project root (ADR-002). Metro only watches
// the project root by default and would not see the package or reload it.
config.watchFolders = [...(config.watchFolders ?? []), sharedPackagesRoot];

// Resolving through the symlink target means the package's own transitive
// lookups must still reach the app's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repositoryRoot, 'node_modules'),
];

module.exports = config;
