import { vi, describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const { mockFetcher } = vi.hoisted(() => ({
  mockFetcher: vi.fn(),
}));

vi.mock('./fetcher', () => ({
  fetcher: mockFetcher,
}));

vi.mock('@cockpit-app/shared-utils', () => ({
  environments: { apiUrl: 'http://localhost' },
}));

import { baseApi } from './baseApi';

const schema = z.object({ id: z.number() });

describe('baseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetcher.mockResolvedValue({ id: 1 });
  });

  it('should call fetcher with GET method and full URL', async () => {
    await baseApi.getRequest('/api/v1/test', schema);
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/api/v1/test',
        options: { method: 'GET' },
      }),
    );
  });

  it('should call fetcher with POST method and JSON body', async () => {
    await baseApi.postRequest('/api/v1/test', schema, { name: 'test' });
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/api/v1/test',
        options: expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      }),
    );
  });

  it('should call fetcher with PUT method and JSON body', async () => {
    await baseApi.putRequest('/api/v1/test', schema, { value: 42 });
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/api/v1/test',
        options: expect.objectContaining({ method: 'PUT' }),
      }),
    );
  });

  it('should call fetcher with DELETE method', async () => {
    await baseApi.deleteRequest('/api/v1/test', schema);
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/api/v1/test',
        options: { method: 'DELETE' },
      }),
    );
  });
});
