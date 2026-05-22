import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockBaseApi } = vi.hoisted(() => ({
  mockBaseApi: {
    getRequest: vi.fn(),
    putRequest: vi.fn(),
    deleteRequest: vi.fn(),
  },
}));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  baseApi: mockBaseApi,
}));

import { getStorePrefixes, createOrUpdateStoreEntry, deleteStoreEntry } from './api';
import { storeEnvelopeSchema } from './schemas';
import { STORE_ENDPOINTS } from './endpoints';

describe('store api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStorePrefixes', () => {
    it('returns parsed string[] when fetch resolves with valid JSON', async () => {
      const prefixes = ['config', 'user'];
      mockBaseApi.getRequest.mockResolvedValue(prefixes);
      const result = await getStorePrefixes();
      expect(result).toEqual(prefixes);
    });

    it('throws on HTTP error response', async () => {
      mockBaseApi.getRequest.mockRejectedValue(new Error('HTTP 500: Internal Server Error'));
      await expect(getStorePrefixes()).rejects.toThrow('HTTP 500');
    });
  });

  describe('storeEnvelopeSchema', () => {
    it('accepts valid envelope', () => {
      const validEnvelope = {
        meta: {
          key: 'test-key',
          type: 'json',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: ['tag1'],
        },
        data: {},
      };
      expect(() => storeEnvelopeSchema.parse(validEnvelope)).not.toThrow();
    });

    it('throws ZodError when meta.key is missing', () => {
      const invalidEnvelope = {
        meta: {
          type: 'json',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [],
        },
        data: {},
      };
      const { ZodError } = require('zod');
      expect(() => storeEnvelopeSchema.parse(invalidEnvelope)).toThrow(ZodError);
    });
  });

  describe('createOrUpdateStoreEntry', () => {
    it('calls baseApi.putRequest with correct endpoint and body', async () => {
      const envelope = {
        meta: {
          key: 'mykey',
          type: 'json',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [],
        },
        data: { value: 42 },
      };
      mockBaseApi.putRequest.mockResolvedValue(envelope);
      const body = { type: 'json', data: { value: 42 } };
      await createOrUpdateStoreEntry('prefix1', 'cat1', 'key1', body);
      expect(mockBaseApi.putRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.entry('prefix1', 'cat1', 'key1'),
        expect.anything(),
        body,
      );
    });
  });

  describe('deleteStoreEntry', () => {
    it('calls baseApi.deleteRequest with correct endpoint', async () => {
      mockBaseApi.deleteRequest.mockResolvedValue(undefined);
      await deleteStoreEntry('prefix1', 'cat1', 'key1');
      expect(mockBaseApi.deleteRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.entry('prefix1', 'cat1', 'key1'),
        expect.anything(),
      );
    });
  });

  describe('getStoreCategories', () => {
    it('calls baseApi.getRequest with categories endpoint', async () => {
      mockBaseApi.getRequest.mockResolvedValue(['cat1', 'cat2']);
      const { getStoreCategories } = await import('./api');
      const result = await getStoreCategories('pfx');
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.categories('pfx'),
        expect.anything(),
      );
      expect(result).toEqual(['cat1', 'cat2']);
    });
  });

  describe('getStoreKeys', () => {
    it('calls baseApi.getRequest with keys endpoint', async () => {
      mockBaseApi.getRequest.mockResolvedValue(['k1', 'k2']);
      const { getStoreKeys } = await import('./api');
      const result = await getStoreKeys('pfx', 'cat');
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.keys('pfx', 'cat'),
        expect.anything(),
      );
      expect(result).toEqual(['k1', 'k2']);
    });
  });

  describe('getStoreEntry', () => {
    it('calls baseApi.getRequest with entry endpoint', async () => {
      const envelope = {
        meta: {
          key: 'p:c:k',
          type: 'object',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [],
        },
        data: {},
      };
      mockBaseApi.getRequest.mockResolvedValue(envelope);
      const { getStoreEntry } = await import('./api');
      const result = await getStoreEntry('p', 'c', 'k');
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.entry('p', 'c', 'k'),
        expect.anything(),
      );
      expect(result).toEqual(envelope);
    });
  });

  describe('resolveStoreEntry', () => {
    it('calls baseApi.getRequest with resolve endpoint', async () => {
      const envelope = {
        meta: {
          key: 'p:c:k',
          type: 'object',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [],
        },
        data: {},
      };
      mockBaseApi.getRequest.mockResolvedValue(envelope);
      const { resolveStoreEntry } = await import('./api');
      const result = await resolveStoreEntry('p', 'c', 'k');
      expect(mockBaseApi.getRequest).toHaveBeenCalledWith(
        STORE_ENDPOINTS.resolve('p', 'c', 'k'),
        expect.anything(),
      );
      expect(result).toEqual(envelope);
    });
  });
});
