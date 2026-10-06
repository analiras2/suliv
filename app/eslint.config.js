// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const sonarjs = require("eslint-plugin-sonarjs");
const security = require("eslint-plugin-security");

module.exports = defineConfig([
  expoConfig,
  sonarjs.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      "no-console": "error",
      "no-debugger": "warn",

      // sonarjs: keep the high-signal subset, drop noisy/duplicate-string style rules
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-redundant-boolean": "error",
      "sonarjs/no-small-switch": "error",
      "sonarjs/prefer-immediate-return": "error",
      "sonarjs/prefer-single-boolean-return": "error",
      "sonarjs/no-nested-template-literals": "error",
      "sonarjs/no-gratuitous-expressions": "error",
      "sonarjs/no-ignored-return": "error",
      "sonarjs/no-use-of-empty-return-value": "error",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-nested-switch": "off",
      "sonarjs/max-switch-cases": "off",

      // security: RN apps rarely touch fs/child_process directly, so keep
      // detect-object-injection off — it's noisy on plain array/object indexing
      "security/detect-object-injection": "off",
    },
  },
  {
    // ADR-006: view models show resolver copy, never the text of a caught error. Services are not
    // covered: they throw ApiError, whose message is a code and never reaches the screen.
    files: [
      "src/**/view-models/**/*.{ts,tsx}",
      "src/**/viewModels/**/*.{ts,tsx}",
      "src/**/use-*-view-model.{ts,tsx}",
    ],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='message'][object.name=/^(caught|error|err|e|[a-zA-Z]*Error)$/]",
          message: "Do not read .message from a caught error in a view model; use getErrorMessage from @/lib/error-messages.",
        },
        {
          selector: "MemberExpression[property.name='message'][object.property.name=/^[a-zA-Z]*[eE]rror$/]",
          message: "Do not read .message from a caught error in a view model; use getErrorMessage from @/lib/error-messages.",
        },
      ],
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
