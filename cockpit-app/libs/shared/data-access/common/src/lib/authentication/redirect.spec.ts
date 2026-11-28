import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('./api', () => ({ logout: vi.fn() }));
vi.mock('@cockpit-app/shared-utils', () => ({
  environments: { loginUrl: 'http://login.test' },
}));

import { logoutAndRedirect } from './redirect';
import { logout } from './api';

describe('logoutAndRedirect', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { location: { href: 'http://habits.test/stats' } });
  });

  it('ends the session, then sends the user to Login with a way back', async () => {
    vi.mocked(logout).mockResolvedValue(undefined as never);
    await logoutAndRedirect();
    expect(logout).toHaveBeenCalledOnce();
    expect(window.location.href).toBe(
      'http://login.test/?redirect_uri=http%3A%2F%2Fhabits.test%2Fstats',
    );
  });

  it('still redirects when the logout call fails', async () => {
    vi.mocked(logout).mockRejectedValue(new Error('offline'));
    await logoutAndRedirect();
    expect(window.location.href).toBe(
      'http://login.test/?redirect_uri=http%3A%2F%2Fhabits.test%2Fstats',
    );
  });
});
