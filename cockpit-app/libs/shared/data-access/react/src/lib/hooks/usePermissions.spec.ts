import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useHasPermission, useIsAdmin } from './usePermissions';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  getCurrentUserPermissions: vi.fn(),
  getCurrentUserRoles: vi.fn(),
}));

import {
  getCurrentUserPermissions,
  getCurrentUserRoles,
} from '@cockpit-app/common-shared-data-access';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useHasPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user has matching permission', async () => {
    vi.mocked(getCurrentUserPermissions).mockResolvedValue([
      { feature: { name: 'budget' }, action: { name: 'read' } },
    ] as never);
    const { result } = renderHook(() => useHasPermission('budget', 'read'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPermission).toBe(true);
  });

  it('should return false when user lacks matching permission', async () => {
    vi.mocked(getCurrentUserPermissions).mockResolvedValue([
      { feature: { name: 'budget' }, action: { name: 'read' } },
    ] as never);
    const { result } = renderHook(() => useHasPermission('budget', 'write'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPermission).toBe(false);
  });

  it('should return false when permissions list is empty', async () => {
    vi.mocked(getCurrentUserPermissions).mockResolvedValue([] as never);
    const { result } = renderHook(() => useHasPermission('budget', 'read'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPermission).toBe(false);
  });
});

describe('useIsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user has Admin role', async () => {
    vi.mocked(getCurrentUserPermissions).mockResolvedValue([] as never);
    vi.mocked(getCurrentUserRoles).mockResolvedValue([
      { name: 'Admin' },
    ] as never);
    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
  });

  it('should return false when user does not have Admin role', async () => {
    vi.mocked(getCurrentUserPermissions).mockResolvedValue([] as never);
    vi.mocked(getCurrentUserRoles).mockResolvedValue([
      { name: 'User' },
    ] as never);
    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });
});
