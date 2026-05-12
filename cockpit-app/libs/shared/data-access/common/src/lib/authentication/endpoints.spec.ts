import { describe, it, expect } from 'vitest';
import { AUTHENTICATION_ENDPOINTS } from './endpoints';

describe('AUTHENTICATION_ENDPOINTS', () => {
  it('returns correct login path', () => {
    expect(AUTHENTICATION_ENDPOINTS.login()).toBe('/api/v1/authentication/sessions/login');
  });

  it('returns correct logout path', () => {
    expect(AUTHENTICATION_ENDPOINTS.logout()).toBe('/api/v1/authentication/sessions/logout');
  });

  it('returns correct refresh path', () => {
    expect(AUTHENTICATION_ENDPOINTS.refresh()).toBe('/api/v1/authentication/tokens/refresh');
  });

  it('returns correct user path', () => {
    expect(AUTHENTICATION_ENDPOINTS.user()).toBe('/api/v1/authentication/sessions/me');
  });

  it('returns correct changePassword path', () => {
    expect(AUTHENTICATION_ENDPOINTS.changePassword()).toBe('/api/v1/authentication/passwords/change');
  });
});
