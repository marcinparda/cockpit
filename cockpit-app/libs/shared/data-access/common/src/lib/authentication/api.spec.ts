import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockBaseApi } = vi.hoisted(() => ({
  mockBaseApi: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
  },
}));

vi.mock('../api/baseApi', () => ({ baseApi: mockBaseApi }));
vi.mock('./endpoints', () => ({
  AUTHENTICATION_ENDPOINTS: {
    login: () => '/api/v1/authentication/sessions/login',
    logout: () => '/api/v1/authentication/sessions/logout',
    refresh: () => '/api/v1/authentication/tokens/refresh',
    user: () => '/api/v1/authentication/sessions/me',
    changePassword: () => '/api/v1/authentication/passwords/change',
  },
}));

import { login, getCurrentUser, refreshAccessToken, logout, changePassword } from './api';

const userInfo = {
  user_id: '1',
  email: 'test@example.com',
  is_active: true,
  password_changed: false,
  created_at: '2024-01-01T00:00:00Z',
};

describe('authentication api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls postRequest with email and password', async () => {
      mockBaseApi.postRequest.mockResolvedValue({ detail: 'ok' });
      await login('a@b.com', 'pass123');
      expect(mockBaseApi.postRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/sessions/login',
        expect.anything(),
        { email: 'a@b.com', password: 'pass123' },
      );
    });
  });

  describe('getCurrentUser', () => {
    it('calls getRequest with user endpoint', async () => {
      mockBaseApi.getRequest.mockResolvedValue(userInfo);
      const result = await getCurrentUser();
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/sessions/me',
        expect.anything(),
        true,
      );
      expect(result).toEqual(userInfo);
    });

    it('passes withRedirect=false when specified', async () => {
      mockBaseApi.getRequest.mockResolvedValue(userInfo);
      await getCurrentUser(false);
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/sessions/me',
        expect.anything(),
        false,
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('calls postRequest with refresh endpoint', async () => {
      mockBaseApi.postRequest.mockResolvedValue({ detail: 'refreshed' });
      await refreshAccessToken();
      expect(mockBaseApi.postRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/tokens/refresh',
        expect.anything(),
        {},
      );
    });
  });

  describe('logout', () => {
    it('calls postRequest with logout endpoint', async () => {
      mockBaseApi.postRequest.mockResolvedValue({ detail: 'logged out' });
      await logout();
      expect(mockBaseApi.postRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/sessions/logout',
        expect.anything(),
        {},
      );
    });
  });

  describe('changePassword', () => {
    it('calls postRequest with current and new password', async () => {
      mockBaseApi.postRequest.mockResolvedValue({ detail: 'changed' });
      await changePassword('oldpass', 'newpass');
      expect(mockBaseApi.postRequest).toHaveBeenCalledWith(
        '/api/v1/authentication/passwords/change',
        expect.anything(),
        { current_password: 'oldpass', new_password: 'newpass' },
      );
    });
  });
});
