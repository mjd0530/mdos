import { describe, expect, it } from 'vitest';
import { PATTERNS } from '../assets/patterns';
import { pickPattern, useDesktopPattern } from './visitPattern';

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

describe('useDesktopPattern', () => {
  it('starts on a pattern; a choice lasts until reset', () => {
    const start = useDesktopPattern.getState().pattern;
    expect(names).toContain(start);
    const other = start === 'weave' ? 'bricks' : 'weave';
    useDesktopPattern.getState().choose(other);
    expect(useDesktopPattern.getState().pattern).toBe(other);
    useDesktopPattern.getState().reset();
    expect(useDesktopPattern.getState().pattern).toBe(start);
  });
});
