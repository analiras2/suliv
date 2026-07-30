// app/ and api/ are independent npm projects (own node_modules, own eslint
// flat config, own jest config), so each glob below shells into its package
// directory before running eslint/jest instead of running them from the repo
// root. Each path is double-quoted for the `bash -c '...'` command below —
// double quotes keep bash from choking on route-group folders like
// `(onboarding)`, since parens lose their special meaning inside them.
const path = require('path');

function toPackageRelative(pkgDir, filenames) {
  return filenames
    .map((file) => path.relative(path.join(__dirname, pkgDir), file))
    .map((file) => `"${file}"`)
    .join(' ');
}

module.exports = {
  'app/**/*.{js,jsx,ts,tsx}': (filenames) => {
    const files = toPackageRelative('app', filenames);
    return [
      `bash -c 'cd app && npx eslint --fix ${files}'`,
      // tsc has no single-file mode that respects the project's type graph, so
      // this always typechecks the whole app/ program, not just staged files.
      `bash -c 'cd app && npx tsc --noEmit'`,
      // --findRelatedTests only runs tests that cover the staged files, not the whole suite.
      `bash -c 'cd app && npx jest --bail --passWithNoTests --findRelatedTests ${files}'`,
    ];
  },
  'api/{src,test}/**/*.ts': (filenames) => {
    const files = toPackageRelative('api', filenames);
    return [
      `bash -c 'cd api && npx eslint --fix ${files}'`,
      `bash -c 'cd api && npx tsc --noEmit'`,
      `bash -c 'cd api && npx jest --bail --passWithNoTests --findRelatedTests ${files}'`,
    ];
  },
};
