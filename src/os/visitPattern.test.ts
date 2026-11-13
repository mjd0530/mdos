import { describe, expect, it } from 'vitest';
import { PATTERNS } from '../assets/patterns';
import { pickPattern } from './visitPattern';

const names = Object.keys(PATTERNS);

describe('pickPattern', () => {
  it('never repeats the last pattern', () => {
    for (const last of names) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        const picked = pickPattern(last, () => r);
        expect(picked).not.toBe(last);
        expect(names).toContain(picked);
      }
    }
  });

  it('can pick every pattern on a first visit', () => {
    const picks = new Set(
      names.map((_, i) => pickPattern(null, () => i / names.length)),
    );
    expect(picks.size).toBe(names.length);
  });

  it('ignores an unknown last pattern', () => {
    expect(names).toContain(pickPattern('plaid', () => 0.5));
  });
});
