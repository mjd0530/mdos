import { describe, expect, it } from 'vitest';
import { step } from './screensaverState';

describe('step', () => {
  it('moves by velocity × time', () => {
    expect(step({ x: 10, y: 10, vx: 20, vy: -10 }, 0.5, 64, 800, 600)).toEqual({
      x: 20,
      y: 5,
      vx: 20,
      vy: -10,
    });
  });

  it('bounces off the right and bottom edges', () => {
    const next = step({ x: 730, y: 530, vx: 40, vy: 40 }, 0.5, 64, 800, 600);
    expect(next.x).toBeLessThanOrEqual(800 - 64);
    expect(next.y).toBeLessThanOrEqual(600 - 64);
    expect(next.vx).toBeLessThan(0);
    expect(next.vy).toBeLessThan(0);
  });

  it('bounces off the left and top edges', () => {
    const next = step({ x: 2, y: 2, vx: -40, vy: -40 }, 0.5, 64, 800, 600);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.y).toBeGreaterThanOrEqual(0);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.vy).toBeGreaterThan(0);
  });
});
