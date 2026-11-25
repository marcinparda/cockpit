import {
  developmentEnvironments,
  environments,
  productionEnvironments,
  selectEnvironments,
} from './environments';

describe('environments', () => {
  it('selects the production config in a production build', () => {
    expect(selectEnvironments(true)).toBe(productionEnvironments);
    expect(productionEnvironments.mode).toBe('production');
  });

  it('selects the development config otherwise', () => {
    expect(selectEnvironments(false)).toBe(developmentEnvironments);
    expect(developmentEnvironments.mode).toBe('development');
  });

  it('falls back to development under vitest (MODE=test)', () => {
    expect(environments).toBe(developmentEnvironments);
  });

  it('production URLs are https and have no localhost', () => {
    for (const [key, value] of Object.entries(productionEnvironments)) {
      if (key === 'mode') continue;
      expect(value).toMatch(/^https:\/\/[a-z]+\.parda\.me/);
    }
  });
});
