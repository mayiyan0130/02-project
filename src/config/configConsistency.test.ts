import { describe, expect, it } from 'vitest';

import { TIME_SLOTS } from './constants';
import { LOCATION_NAME_LIST, LOCATION_OPEN_TIME } from './locations';
import { LocationOpenMode } from './types';

describe('config consistency', () => {
  it('LOCATION_OPEN_TIME keys match LOCATION_NAME_LIST', () => {
    const keys = Object.keys(LOCATION_OPEN_TIME).sort();
    const list = [...LOCATION_NAME_LIST].sort();
    expect(keys).toEqual(list);
  });

  it('LOCATION_NAME_LIST has no duplicates', () => {
    const set = new Set(LOCATION_NAME_LIST);
    expect(set.size).toBe(LOCATION_NAME_LIST.length);
  });

  it('openSlots only use TIME_SLOTS', () => {
    const slotSet = new Set(TIME_SLOTS);
    for (const [name, config] of Object.entries(LOCATION_OPEN_TIME)) {
      if (config.mode === LocationOpenMode.AllDay || config.mode === LocationOpenMode.Slots || config.mode === LocationOpenMode.EventOnly) {
        for (const slot of config.openSlots) {
          expect(slotSet.has(slot)).toBe(true);
        }
      } else {
        throw new Error(`Unknown open mode for ${name}`);
      }
    }
  });
});

