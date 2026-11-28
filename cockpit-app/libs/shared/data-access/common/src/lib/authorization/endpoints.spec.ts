import { describe, it, expect } from 'vitest';
import { AUTHORIZATION_ENDPOINTS } from './endpoints';

describe('AUTHORIZATION_ENDPOINTS', () => {
  it('returns correct currentUserRoles path', () => {
    expect(AUTHORIZATION_ENDPOINTS.currentUserRoles()).toBe('/api/v1/authorization/roles/me');
  });

  it('returns correct allRoles path', () => {
    expect(AUTHORIZATION_ENDPOINTS.allRoles()).toBe('/api/v1/authorization/roles/');
  });

  it('returns correct allPermissions path', () => {
    expect(AUTHORIZATION_ENDPOINTS.allPermissions()).toBe('/api/v1/authorization/permissions');
  });

  it('returns correct currentUserPermissions path', () => {
    expect(AUTHORIZATION_ENDPOINTS.currentUserPermissions()).toBe('/api/v1/authorization/user-permissions/me');
  });
});
