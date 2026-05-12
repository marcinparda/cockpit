import { describe, it, expect } from 'vitest';
import { USER_MANAGEMENT_ENDPOINTS } from './endpoints';

describe('USER_MANAGEMENT_ENDPOINTS', () => {
  it('returns correct users path', () => {
    expect(USER_MANAGEMENT_ENDPOINTS.users()).toBe('/api/v1/users');
  });

  it('returns correct userById path', () => {
    expect(USER_MANAGEMENT_ENDPOINTS.userById('123')).toBe('/api/v1/users/123');
  });

  it('returns correct changeUserRole path', () => {
    expect(USER_MANAGEMENT_ENDPOINTS.changeUserRole('123')).toBe('/api/v1/users/123/role');
  });

  it('returns correct userPermissions path', () => {
    expect(USER_MANAGEMENT_ENDPOINTS.userPermissions('123')).toBe('/api/v1/users/123/permissions');
  });

  it('returns correct userPermissionById path', () => {
    expect(USER_MANAGEMENT_ENDPOINTS.userPermissionById('123', 'p1')).toBe('/api/v1/users/123/permissions/p1');
  });
});
