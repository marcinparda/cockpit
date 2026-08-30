import { describe, it, expect } from 'vitest';
import { HABIT_ICONS } from '../icons/index';

describe('HABIT_ICONS', () => {
  it('does not map two different keys to the same icon component', () => {
    const seen = new Map<unknown, string>();
    for (const [key, Icon] of Object.entries(HABIT_ICONS)) {
      const dupeKey = seen.get(Icon);
      expect(dupeKey, `${key} duplicates icon already used by ${dupeKey}`).toBeUndefined();
      seen.set(Icon, key);
    }
  });

  it('includes the newly requested icons', () => {
    expect(HABIT_ICONS['Computer']).toBeDefined();
    expect(HABIT_ICONS['Keyboard']).toBeDefined();
    expect(HABIT_ICONS['Instrument']).toBeDefined();
    expect(HABIT_ICONS['Running']).toBeDefined();
    expect(HABIT_ICONS['Football']).toBeDefined();
    expect(HABIT_ICONS['Home']).toBeDefined();
    expect(HABIT_ICONS['Money']).toBeDefined();
    expect(HABIT_ICONS['Tree']).toBeDefined();
  });

  it('no longer has the removed duplicate Walk key', () => {
    expect(HABIT_ICONS['Walk']).toBeUndefined();
  });
});
