import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockBaseApi } = vi.hoisted(() => ({
  mockBaseApi: {
    getRequest: vi.fn(),
  },
}));

vi.mock('../api/baseApi', () => ({ baseApi: mockBaseApi }));
vi.mock('./endpoints', () => ({
  AUTHORIZATION_ENDPOINTS: {
    currentUserPermissions: () => '/api/v1/authorization/user-permissions/me',
    currentUserRoles: () => '/api/v1/authorization/roles/me',
  },
}));

import { getCurrentUserPermissions, getCurrentUserRoles } from './api';

describe('authorization api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserPermissions', () => {
    it('calls getRequest with permissions endpoint', async () => {
      mockBaseApi.getRequest.mockResolvedValue([]);
      await getCurrentUserPermissions();
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        '/api/v1/authorization/user-permissions/me',
        expect.anything(),
      );
    });

    it('returns permissions array', async () => {
      const perms = [{ id: 'p1', feature_id: 'f1', action_id: 'a1' }];
      mockBaseApi.getRequest.mockResolvedValue(perms);
      const result = await getCurrentUserPermissions();
      expect(result).toEqual(perms);
    });
  });

  describe('getCurrentUserRoles', () => {
    it('calls getRequest with roles endpoint', async () => {
      mockBaseApi.getRequest.mockResolvedValue([]);
      await getCurrentUserRoles();
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        '/api/v1/authorization/roles/me',
        expect.anything(),
      );
    });

    it('returns roles array', async () => {
      const roles = [{ id: '1', name: 'admin' }];
      mockBaseApi.getRequest.mockResolvedValue(roles);
      const result = await getCurrentUserRoles();
      expect(result).toEqual(roles);
    });
  });
});
