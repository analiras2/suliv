// app/ and api/ are independent npm projects (own node_modules, own eslint
// flat config, own jest config), so each glob below shells into its package
// directory before running eslint/jest instead of running them from the repo
// root. Assumes no filenames contain spaces (true for this repo).
const path = require('path');

function toPackageRelative(pkgDir, filenames) {
  return filenames.map((file) => path.relative(path.join(__dirname, pkgDir), file)).join(' ');
}

module.exports = {
  'app/**/*.{js,jsx,ts,tsx}': (filenames) => {
    const files = toPackageRelative('app', filenames);
    return [
      `bash -c 'cd app && npx eslint --fix ${files}'`,
      // --findRelatedTests only runs tests that cover the staged files, not the whole suite.
      `bash -c 'cd app && npx jest --bail --passWithNoTests --findRelatedTests ${files}'`,
    ];
  },
  'api/{src,test}/**/*.ts': (filenames) => {
    const files = toPackageRelative('api', filenames);
    return [
      `bash -c 'cd api && npx eslint --fix ${files}'`,
      `bash -c 'cd api && npx jest --bail --passWithNoTests --findRelatedTests ${files}'`,
    ];
  },
};
