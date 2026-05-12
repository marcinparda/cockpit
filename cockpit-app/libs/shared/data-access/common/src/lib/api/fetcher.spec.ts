import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

const { mockRefreshAccessToken, mockLogout } = vi.hoisted(() => ({
  mockRefreshAccessToken: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock('../authentication/api', () => ({
  refreshAccessToken: mockRefreshAccessToken,
  logout: mockLogout,
}));

vi.mock('@cockpit-app/shared-utils', () => ({
  environments: { loginUrl: 'http://localhost/login', apiUrl: 'http://localhost' },
}));

import { fetcher } from './fetcher';

function makeResponse(status: number, body?: unknown, ok?: boolean) {
  return {
    status,
    ok: ok ?? (status >= 200 && status < 300),
    statusText: 'Status',
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(''),
  };
}

describe('fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { location: { href: 'http://localhost/app' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return Zod-parsed data on 200 response', async () => {
    const schema = z.object({ name: z.string() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200, { name: 'test' })));

    const result = await fetcher({ url: '/api/test', responseDataSchema: schema });
    expect(result).toEqual({ name: 'test' });
  });

  it('should return undefined on 204 response when schema allows undefined', async () => {
    const schema = z.undefined();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(204)));

    const result = await fetcher({ url: '/api/test', responseDataSchema: schema });
    expect(result).toBeUndefined();
  });

  it('should retry and return data when 401 followed by successful refreshAccessToken', async () => {
    const schema = z.object({ id: z.number() });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse(401, undefined, false))
      .mockResolvedValueOnce(makeResponse(200, { id: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    mockRefreshAccessToken.mockResolvedValue(undefined);

    const result = await fetcher({ url: '/api/test', responseDataSchema: schema });
    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should call logout and redirect when 401 + refreshAccessToken throws + withRedirect=true', async () => {
    const schema = z.object({ id: z.number() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, undefined, false)));
    mockRefreshAccessToken.mockRejectedValue(new Error('refresh failed'));
    mockLogout.mockResolvedValue(undefined);

    await expect(
      fetcher({ url: '/api/test', responseDataSchema: schema, withRedirect: true }),
    ).rejects.toThrow('HTTP 401');
    expect(mockLogout).toHaveBeenCalled();
    expect(globalThis.window.location.href).toContain('localhost/login');
  });

  it('should call logout but NOT redirect when 401 + refreshAccessToken throws + withRedirect=false', async () => {
    const schema = z.object({ id: z.number() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, undefined, false)));
    mockRefreshAccessToken.mockRejectedValue(new Error('refresh failed'));

    const originalHref = globalThis.window.location.href;
    await expect(
      fetcher({ url: '/api/test', responseDataSchema: schema, withRedirect: false }),
    ).rejects.toThrow('HTTP 401');
    // logout should NOT be called since withRedirect=false skips the logout+redirect block
    expect(mockLogout).not.toHaveBeenCalled();
    expect(globalThis.window.location.href).toBe(originalHref);
  });

  it('should throw with status message on 500 response', async () => {
    const schema = z.object({ id: z.number() });
    const resp = {
      status: 500,
      ok: false,
      statusText: 'Internal Server Error',
      text: vi.fn().mockResolvedValue('server error'),
      json: vi.fn(),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp));

    await expect(
      fetcher({ url: '/api/test', responseDataSchema: schema }),
    ).rejects.toThrow('HTTP 500');
  });

  it('should throw ZOD ERROR on Zod parse error', async () => {
    const schema = z.object({ required: z.string() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200, { wrong: 'field' })));

    await expect(
      fetcher({ url: '/api/test', responseDataSchema: schema }),
    ).rejects.toThrow('[ZOD ERROR]');
  });

  it('should not set credentials when withCredentials=false', async () => {
    const schema = z.object({ ok: z.boolean() });
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await fetcher({ url: '/api/test', responseDataSchema: schema, withCredentials: false });

    const calledOptions = fetchMock.mock.calls[0][1];
    expect(calledOptions.credentials).toBeUndefined();
  });
});
