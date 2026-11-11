import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings, useSettings } from './settings';

describe('sanitizeSettings', () => {
  it('keeps valid values', () => {
    expect(sanitizeSettings({ pattern: 'bricks', clock24h: true })).toEqual({
      pattern: 'bricks',
      clock24h: true,
    });
  });

  it('replaces unknown or malformed values with defaults', () => {
    expect(sanitizeSettings({ pattern: 'plaid', clock24h: 'yes' })).toEqual(
      DEFAULT_SETTINGS,
    );
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
