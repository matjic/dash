import { describe, it, expect } from 'vitest';
import { MS_PER_DAY } from './constants';

describe('constants', () => {
  it('MS_PER_DAY should equal 24 * 60 * 60 * 1000', () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
    expect(MS_PER_DAY).toBe(86400000);
  });
});
