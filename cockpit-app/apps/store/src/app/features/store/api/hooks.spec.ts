import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('./api', () => ({
  getStorePrefixes: vi.fn(),
  getStoreCategories: vi.fn(),
  getStoreKeys: vi.fn(),
  getStoreEntry: vi.fn(),
  createOrUpdateStoreEntry: vi.fn(),
  deleteStoreEntry: vi.fn(),
}));

import {
  getStorePrefixes,
  getStoreCategories,
  getStoreKeys,
  getStoreEntry,
  createOrUpdateStoreEntry,
  deleteStoreEntry,
} from './api';
import {
  useStorePrefixes,
  useStoreCategories,
  useStoreKeys,
  useStoreEntry,
  useCreateOrUpdateStoreEntry,
  useDeleteStoreEntry,
} from './hooks';

const mockGetStorePrefixes = getStorePrefixes as ReturnType<typeof vi.fn>;
const mockGetStoreCategories = getStoreCategories as ReturnType<typeof vi.fn>;
const mockGetStoreKeys = getStoreKeys as ReturnType<typeof vi.fn>;
const mockGetStoreEntry = getStoreEntry as ReturnType<typeof vi.fn>;
const mockCreateOrUpdateStoreEntry = createOrUpdateStoreEntry as ReturnType<typeof vi.fn>;
const mockDeleteStoreEntry = deleteStoreEntry as ReturnType<typeof vi.fn>;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('store hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStorePrefixes: fetches and returns prefix list', async () => {
    mockGetStorePrefixes.mockResolvedValue(['a', 'b']);

    const { result } = renderHook(() => useStorePrefixes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['a', 'b']);
  });

  it('useStoreCategories: fetches categories when prefix is non-empty', async () => {
    mockGetStoreCategories.mockResolvedValue(['cat1']);

    const { result } = renderHook(() => useStoreCategories('pfx'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetStoreCategories).toHaveBeenCalledWith('pfx');
    expect(result.current.data).toEqual(['cat1']);
  });

  it('useStoreCategories: does not fetch when prefix is empty string', () => {
    const { result } = renderHook(() => useStoreCategories(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetStoreCategories).not.toHaveBeenCalled();
  });

  it('useStoreKeys: fetches keys when prefix and category are non-empty', async () => {
    mockGetStoreKeys.mockResolvedValue(['k1', 'k2']);

    const { result } = renderHook(() => useStoreKeys('pfx', 'cat'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetStoreKeys).toHaveBeenCalledWith('pfx', 'cat');
    expect(result.current.data).toEqual(['k1', 'k2']);
  });

  it('useStoreEntry: fetches entry when all params are non-empty', async () => {
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
    mockGetStoreEntry.mockResolvedValue(envelope);

    const { result } = renderHook(() => useStoreEntry('p', 'c', 'k'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(envelope);
  });

  it('useCreateOrUpdateStoreEntry: calls createOrUpdateStoreEntry with correct args', async () => {
    const envelope = {
      meta: {
        key: 'p:c:k',
        type: 'object',
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        tags: [],
      },
      data: { val: 1 },
    };
    mockCreateOrUpdateStoreEntry.mockResolvedValue(envelope);

    const { result } = renderHook(() => useCreateOrUpdateStoreEntry(), {
      wrapper: createWrapper(),
    });

    const body = { type: 'object', tags: [], data: { val: 1 } };
    result.current.mutate({ prefix: 'p', category: 'c', key: 'k', body });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateOrUpdateStoreEntry).toHaveBeenCalledWith('p', 'c', 'k', body);
  });

  it('useDeleteStoreEntry: calls deleteStoreEntry with correct args', async () => {
    mockDeleteStoreEntry.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteStoreEntry(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ prefix: 'p', category: 'c', key: 'k' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteStoreEntry).toHaveBeenCalledWith('p', 'c', 'k');
  });
});
