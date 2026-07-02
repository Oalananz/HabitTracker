import { describe, expect, it } from 'vitest';
import {
  isLifeAreaId,
  getLifeArea,
  lifeAreaLabel,
  lifeAreaColor,
  lifeAreaLabelToId,
  LIFE_AREA_IDS,
} from './lifeAreas';

describe('isLifeAreaId', () => {
  it('accepts every known id', () => {
    for (const id of LIFE_AREA_IDS) {
      expect(isLifeAreaId(id)).toBe(true);
    }
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isLifeAreaId('not_a_real_area')).toBe(false);
    expect(isLifeAreaId(null)).toBe(false);
    expect(isLifeAreaId(undefined)).toBe(false);
    expect(isLifeAreaId(42)).toBe(false);
  });
});

describe('getLifeArea / lifeAreaLabel / lifeAreaColor', () => {
  it('returns undefined/defaults for null or unknown ids', () => {
    expect(getLifeArea(null)).toBeUndefined();
    expect(getLifeArea('bogus')).toBeUndefined();
    expect(lifeAreaLabel(null)).toBe('Unassigned');
    expect(lifeAreaColor('bogus')).toBe('#8a8f98');
  });

  it('resolves a known id to its area', () => {
    expect(getLifeArea('health')?.label).toBe('Health');
    expect(lifeAreaLabel('work_business')).toBe('Work / Business');
  });
});

describe('lifeAreaLabelToId', () => {
  it('maps a display label back to its id, case-insensitively', () => {
    expect(lifeAreaLabelToId('Health')).toBe('health');
    expect(lifeAreaLabelToId('work / business')).toBe('work_business');
  });

  it('maps a short label back to its id', () => {
    expect(lifeAreaLabelToId('Work')).toBe('work_business');
  });

  it('returns null for unrecognized input', () => {
    expect(lifeAreaLabelToId('not a real area')).toBeNull();
    expect(lifeAreaLabelToId(null)).toBeNull();
    expect(lifeAreaLabelToId('')).toBeNull();
  });
});
