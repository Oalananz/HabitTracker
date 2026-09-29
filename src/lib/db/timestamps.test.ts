import { describe, expect, it } from 'vitest';
import { timestamptzToIso } from './index';

describe('timestamptzToIso', () => {
  it('converts Postgres text timestamps to ISO strings in UTC', () => {
    expect(timestamptzToIso('2026-09-29 22:03:45.657246+00')).toBe('2026-09-29T22:03:45.657Z');
    expect(timestamptzToIso('2026-09-30 01:03:45+03')).toBe('2026-09-29T22:03:45.000Z');
    expect(timestamptzToIso('2026-09-30 03:33:45.5+05:30')).toBe('2026-09-29T22:03:45.500Z');
  });

  it('is stable when applied repeatedly (module evaluated per server chunk)', () => {
    const once = timestamptzToIso('2026-09-29 22:03:45+00');
    expect(timestamptzToIso(once)).toBe(once);
  });

  it('passes through values it cannot parse', () => {
    expect(timestamptzToIso('infinity')).toBe('infinity');
  });
});
