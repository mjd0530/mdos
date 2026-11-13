import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../ui/pixels';
import {
  DEFAULT_SETTINGS,
  HIGHLIGHTS,
  sanitizeSettings,
  useSettings,
} from './settings';

describe('sanitizeSettings', () => {
  it('keeps valid values', () => {
    const place = { name: 'Paris', latitude: 48.85, longitude: 2.35 };
    expect(
      sanitizeSettings({
        display: 'bw',
        highlight: 'gold',
        pattern: 'bricks',
        clock24h: true,
        weatherUnit: 'celsius',
        weatherPlace: place,
      }),
    ).toEqual({
      display: 'bw',
      highlight: 'gold',
      pattern: 'bricks',
      clock24h: true,
      weatherUnit: 'celsius',
      weatherPlace: { ...place, region: undefined },
      screensaver: true,
      screensaverMinutes: 5,
      cursorClock: true,
      sounds: true,
      volume: 0.5,
    });
  });

  it('replaces unknown or malformed values with defaults', () => {
    expect(
      sanitizeSettings({
        display: 'sepia',
        highlight: 'neon',
        pattern: 'plaid',
        clock24h: 'yes',
        weatherUnit: 'kelvin',
        weatherPlace: { name: 'Nowhere', latitude: 999, longitude: 0 },
        screensaver: 'on',
        screensaverMinutes: 7,
        volume: 3,
      }),
    ).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });
});

describe('useSettings', () => {
  it('changes one setting and restores defaults', () => {
    useSettings.getState().set('pattern', 'weave');
    expect(useSettings.getState().pattern).toBe('weave');
    useSettings.getState().restoreDefaults();
    expect(useSettings.getState().pattern).toBe(DEFAULT_SETTINGS.pattern);
  });
});

describe('highlight colours', () => {
  it.each(Object.entries(HIGHLIGHTS))(
    '%s keeps black text readable (4.5:1 or more)',
    (_key, { color }) => {
      expect(contrastRatio(color, '#000000')).toBeGreaterThanOrEqual(4.5);
    },
  );
});
