// Lints the source piped on stdin as if it lived at <filePath>, with the project's real ESLint
// config, and prints the ids of the violated react-native-a11y rules as JSON. Used by
// src/lib/a11y-lint.test.ts to prove the accessibility rule set fires (Lint-CI-001).
const { ESLint } = require('eslint');

const A11Y_RULE_PREFIX = 'react-native-a11y/';

async function main() {
  const filePath = process.argv[2];
  const chunks = [];
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) chunks.push(chunk);

  const eslint = new ESLint({ cwd: process.cwd() });
  const [result] = await eslint.lintText(chunks.join(''), { filePath });
  const ruleIds = result.messages
    .map((message) => message.ruleId ?? '')
    .filter((ruleId) => ruleId.startsWith(A11Y_RULE_PREFIX));

  process.stdout.write(JSON.stringify(ruleIds));
}

main().catch((error) => {
  process.stderr.write(String(error));
  process.exit(1);
});
