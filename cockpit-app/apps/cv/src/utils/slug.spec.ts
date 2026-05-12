import { generateSlug, generateUniqueSlug } from './slug';

describe('generateSlug', () => {
  it('lowercases input', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(generateSlug('foo & bar!')).toBe('foo-bar');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  hello  ')).toBe('hello');
  });

  it('collapses multiple special chars into single hyphen', () => {
    expect(generateSlug('foo---bar')).toBe('foo-bar');
  });
});

describe('generateUniqueSlug', () => {
  it('returns base slug when no conflict', () => {
    expect(generateUniqueSlug('My Page', [])).toBe('my-page');
  });

  it('appends counter when slug already taken', () => {
    expect(generateUniqueSlug('My Page', ['my-page'])).toBe('my-page-2');
  });

  it('increments counter until unique', () => {
    expect(generateUniqueSlug('My Page', ['my-page', 'my-page-2'])).toBe(
      'my-page-3',
    );
  });

  it('blocks reserved slugs', () => {
    expect(generateUniqueSlug('base', [])).toBe('base-2');
  });

  it('blocks reserved slug "registry"', () => {
    expect(generateUniqueSlug('registry', [])).toBe('registry-2');
  });
});
