import { describe, it, expect } from 'vitest';
import { simpleRefreshResponseSchema, logoutResponseSchema } from './schemas';

describe('api schemas', () => {
  it('validates simpleRefreshResponseSchema', () => {
    const result = simpleRefreshResponseSchema.parse({ detail: 'ok' });
    expect(result).toEqual({ detail: 'ok' });
  });

  it('validates logoutResponseSchema', () => {
    const result = logoutResponseSchema.parse({ detail: 'logged out' });
    expect(result).toEqual({ detail: 'logged out' });
  });

  it('throws on invalid simpleRefreshResponseSchema input', () => {
    expect(() => simpleRefreshResponseSchema.parse({})).toThrow();
  });
});
