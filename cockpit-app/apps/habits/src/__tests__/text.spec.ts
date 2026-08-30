import { describe, it, expect } from 'vitest';
import { truncateName } from '../utils/text';

describe('truncateName', () => {
  it('returns name unchanged when exactly 50 chars', () => {
    const name = 'a'.repeat(50);
    expect(truncateName(name)).toBe(name);
  });

  it('returns name unchanged when under 50 chars', () => {
    expect(truncateName('Morning run')).toBe('Morning run');
  });

  it('truncates and appends ellipsis when over 50 chars', () => {
    const name = 'a'.repeat(51);
    const result = truncateName(name);
    expect(result).toBe(`${'a'.repeat(50)}…`);
    expect(result.length).toBe(51);
  });

  it('supports a custom maxLength', () => {
    expect(truncateName('abcdef', 3)).toBe('abc…');
  });
});
