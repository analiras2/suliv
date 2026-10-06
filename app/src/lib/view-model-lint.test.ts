import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

const APP_ROOT = path.resolve(__dirname, '../..');
const ESLINT_BIN = path.join(APP_ROOT, 'node_modules/eslint/bin/eslint.js');
const LINT_TIMEOUT_MS = 60_000;
const CAUGHT_MESSAGE_SOURCE = `
export function describeFailure(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'x';
}
`;

interface LintMessage {
  ruleId: string | null;
  message: string;
}

/** Runs the project's real ESLint config over the fixture as if it lived at `filePath`. */
function lintAs(filePath: string): LintMessage[] {
  const run = spawnSync(
    process.execPath,
    [ESLINT_BIN, '--stdin', '--stdin-filename', path.join(APP_ROOT, filePath), '--format', 'json'],
    { cwd: APP_ROOT, input: CAUGHT_MESSAGE_SOURCE, encoding: 'utf8' },
  );
  const [result] = JSON.parse(run.stdout) as { messages: LintMessage[] }[];
  return result.messages.filter((message) => message.ruleId === 'no-restricted-syntax');
}

describe('view model lint guard (ADR-006)', () => {
  it(
    'UT-069 reports reading .message from a caught error in a view model',
    () => {
      const messages = lintAs('src/module/fixture/view-models/use-fixture-view-model.ts');

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain('getErrorMessage');
    },
    LINT_TIMEOUT_MS,
  );

  it(
    'UT-069 does not report the same expression in a service file',
    () => {
      expect(lintAs('src/module/fixture/services/fixture-service.ts')).toHaveLength(0);
    },
    LINT_TIMEOUT_MS,
  );
});
