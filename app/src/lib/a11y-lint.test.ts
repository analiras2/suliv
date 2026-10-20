import { describe, expect, it } from '@jest/globals';
import { execFileSync } from 'node:child_process';

// Lint-CI-001: proves the accessibility rule set is wired in and fires, rather than assuming it.
const LINT_TIMEOUT_MS = 60_000;

const MISSING_PROPS_SOURCE = `
import { Pressable, Text } from 'react-native';

export function Fixture({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text>Salvar</Text>
    </Pressable>
  );
}
`;

const COMPLIANT_SOURCE = `
import { Pressable, Text } from 'react-native';

export function Fixture({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Salvar" onPress={onPress}>
      <Text>Salvar</Text>
    </Pressable>
  );
}
`;

function lintA11y(source: string, filePath: string): string[] {
  const output = execFileSync(process.execPath, ['scripts/lint-a11y-source.js', filePath], {
    cwd: process.cwd(),
    input: source,
    encoding: 'utf8',
  });
  return JSON.parse(output) as string[];
}

describe('accessibility lint rules', () => {
  it(
    'flags a Pressable without accessibility props inside src/components',
    () => {
      const violations = lintA11y(MISSING_PROPS_SOURCE, 'src/components/fixture.tsx');

      expect(violations).toContain('react-native-a11y/has-valid-accessibility-descriptors');
    },
    LINT_TIMEOUT_MS,
  );

  it(
    'accepts a Pressable that has a role and a label',
    () => {
      const violations = lintA11y(COMPLIANT_SOURCE, 'src/components/fixture.tsx');

      expect(violations).toEqual([]);
    },
    LINT_TIMEOUT_MS,
  );

  it(
    'does not apply the rules outside src/components and src/screens',
    () => {
      const violations = lintA11y(MISSING_PROPS_SOURCE, 'src/lib/fixture.tsx');

      expect(violations).toEqual([]);
    },
    LINT_TIMEOUT_MS,
  );
});
