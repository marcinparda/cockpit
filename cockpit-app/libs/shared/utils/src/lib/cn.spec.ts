import { cn } from './cn';

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles undefined values', () => {
    expect(cn('foo', undefined)).toBe('foo');
  });

  it('handles null values', () => {
    expect(cn('foo', null)).toBe('foo');
  });

  it('handles conditional object syntax', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });
});
