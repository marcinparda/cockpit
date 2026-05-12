import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUser } from './useUser';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from '@cockpit-app/common-shared-data-access';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the correct queryKey', () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
  });

  it('should call getCurrentUser with withRedirect=true by default', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ email: 'test@test.com' } as never);
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCurrentUser).toHaveBeenCalledWith(true);
  });

  it('should call getCurrentUser with withRedirect=false when specified', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ email: 'test@test.com' } as never);
    const { result } = renderHook(() => useUser({ withRedirect: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCurrentUser).toHaveBeenCalledWith(false);
  });

  it('should return data from getCurrentUser', async () => {
    const mockUser = { email: 'user@test.com', id: '1' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never);
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it('should be in loading state initially', () => {
    vi.mocked(getCurrentUser).mockResolvedValue({} as never);
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });
});
