/* global __dirname */
// Plain JavaScript on purpose: importing node:fs from a .ts test pulls the Node typings
// into the TypeScript program, where they conflict with the global fetch mocks of other tests.
const { describe, expect, it } = require('@jest/globals');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const MAESTRO_DIRECTORY = join(__dirname, '..', '..', '.maestro');
const AIRPLANE_MODE_PATTERN = /^\s*-\s*setAirplaneMode:\s*(\S+)\s*$/;
const VALID_AIRPLANE_MODE_VALUES = ['enabled', 'disabled'];

function findAirplaneModeUsages() {
  return readdirSync(MAESTRO_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.yaml'))
    .flatMap((fileName) =>
      readFileSync(join(MAESTRO_DIRECTORY, fileName), 'utf8')
        .split('\n')
        .flatMap((text, index) => {
          const match = AIRPLANE_MODE_PATTERN.exec(text);
          return match ? [{ file: fileName, line: index + 1, value: match[1] }] : [];
        }),
    );
}

describe('Maestro flows', () => {
  it('only pass enabled or disabled to setAirplaneMode, the values Maestro accepts', () => {
    const usages = findAirplaneModeUsages();
    const invalidUsages = usages.filter(({ value }) => !VALID_AIRPLANE_MODE_VALUES.includes(value));

    expect(usages.length).toBeGreaterThan(0);
    expect(invalidUsages).toEqual([]);
  });
});
