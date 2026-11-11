import { describe, expect, it } from 'vitest';
import { isPoint, isRect, sanitizeRecord } from './persist';

describe('sanitizeRecord', () => {
  it('keeps good entries and drops bad ones', () => {
    expect(
      sanitizeRecord(
        {
          a: { x: 1, y: 2 },
          b: { x: 'no', y: 2 },
          c: null,
          d: { x: NaN, y: 0 },
        },
        isPoint,
      ),
    ).toEqual({ a: { x: 1, y: 2 } });
  });

  it('turns non-objects into an empty record', () => {
    expect(sanitizeRecord('garbage', isPoint)).toEqual({});
    expect(sanitizeRecord([1, 2], isPoint)).toEqual({});
    expect(sanitizeRecord(undefined, isPoint)).toEqual({});
  });
});

describe('isRect', () => {
  it('needs four finite numbers and a positive size', () => {
    expect(isRect({ x: 0, y: 0, w: 10, h: 10 })).toBe(true);
    expect(isRect({ x: 0, y: 0, w: 0, h: 10 })).toBe(false);
    expect(isRect({ x: 0, y: 0, w: 10 })).toBe(false);
  });
});
