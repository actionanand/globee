import { describe, expect, it } from 'vitest';
import { isAllowedDatelineEdge } from './geojson-validation.mjs';

describe('isAllowedDatelineEdge', () => {
  it('allows a normal segment and a dateline closure', () => {
    expect(isAllowedDatelineEdge([-20, 12], [20, 12])).toBe(false);
    expect(isAllowedDatelineEdge([-180, 12], [180, 12])).toBe(true);
  });

  it('allows Arctic and Antarctica closures but rejects ordinary jumps', () => {
    expect(isAllowedDatelineEdge([-170, 90], [170, 90])).toBe(true);
    expect(isAllowedDatelineEdge([-180, -90], [180, -90])).toBe(true);
    expect(isAllowedDatelineEdge([-170, 15], [170, 15])).toBe(false);
  });
});
