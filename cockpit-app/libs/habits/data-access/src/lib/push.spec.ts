import { describe, it, expect, vi, afterEach } from 'vitest';
import { environments } from '@cockpit-app/shared-utils';
import { fetchVapidPublicKey } from './push';

describe('fetchVapidPublicKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the public key, sending cookies', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ public_key: 'vapid_key' }),
    } as Response);

    await expect(fetchVapidPublicKey()).resolves.toBe('vapid_key');
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environments.apiUrl}/api/v1/habits/settings/vapid-public-key`,
      { credentials: 'include' },
    );
  });

  it('throws when the API responds with an error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);
    await expect(fetchVapidPublicKey()).rejects.toThrow(
      'Failed to fetch VAPID public key',
    );
  });
});
