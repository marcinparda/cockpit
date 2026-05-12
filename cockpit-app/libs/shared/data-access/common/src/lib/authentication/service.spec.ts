import { vi, describe, it, expect } from 'vitest';

vi.mock('./api', () => ({
  getCurrentUser: vi.fn(),
  changePassword: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

import { isLoggedIn } from './service';
import { getCurrentUser } from './api';

describe('isLoggedIn', () => {
  it('returns true when getCurrentUser resolves with a user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user_id: '1',
      email: 'a@b.com',
      is_active: true,
      password_changed: false,
      created_at: '2024-01-01',
    });
    expect(await isLoggedIn()).toBe(true);
  });

  it('returns false when getCurrentUser resolves with null', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null as never);
    expect(await isLoggedIn()).toBe(false);
  });

  it('returns false when getCurrentUser throws', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('unauthorized'));
    expect(await isLoggedIn()).toBe(false);
  });

  it('passes withRedirect argument to getCurrentUser', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user_id: '1',
      email: 'a@b.com',
      is_active: true,
      password_changed: false,
      created_at: '2024-01-01',
    });
    await isLoggedIn(false);
    expect(getCurrentUser).toHaveBeenCalledWith(false);
  });
});
