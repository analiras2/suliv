import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAESTRO_DIRECTORY = join(__dirname, '..', '..', '.maestro');
const AIRPLANE_MODE_PATTERN = /^\s*-\s*setAirplaneMode:\s*(\S+)\s*$/;
const VALID_AIRPLANE_MODE_VALUES = ['enabled', 'disabled'];

interface AirplaneModeUsage {
  file: string;
  line: number;
  value: string;
}

function findAirplaneModeUsages(): AirplaneModeUsage[] {
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
