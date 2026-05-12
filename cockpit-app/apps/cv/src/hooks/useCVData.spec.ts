import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCVData } from './useCVData';
import { getCVData, putCVData } from '../services/cvStoreApi';

vi.mock('../services/cvStoreApi', () => ({
  getCVData: vi.fn(),
  putCVData: vi.fn(),
}));

vi.mock('../services/presetApi', () => ({
  fetchPresetSection: vi.fn(),
  savePresetSection: vi.fn(),
  fetchRegistry: vi.fn(),
  saveRegistry: vi.fn(),
  clonePresetSections: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCVData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be in loading state initially', () => {
    vi.mocked(getCVData).mockResolvedValue(null);
    const { result } = renderHook(() => useCVData(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('should load CV data from API and update cvData', async () => {
    const mockData = { header: { name: 'Test User' } } as never;
    vi.mocked(getCVData).mockResolvedValue(mockData);
    const { result } = renderHook(() => useCVData('base'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cvData).toEqual(mockData);
  });

  it('should start with isDirty=false', async () => {
    vi.mocked(getCVData).mockResolvedValue(null);
    const { result } = renderHook(() => useCVData('base'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDirty).toBe(false);
  });

  it('should mark dirty when markDirty called with non-base preset', async () => {
    vi.mocked(getCVData).mockResolvedValue(null);
    const { result } = renderHook(() => useCVData('my-preset'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.markDirty('header');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtySet.has('header')).toBe(true);
  });

  it('should call putCVData on saveToApi for base preset', async () => {
    vi.mocked(getCVData).mockResolvedValue(null);
    vi.mocked(putCVData).mockResolvedValue(undefined);
    const { result } = renderHook(() => useCVData('base'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.saveToApi();
    });

    await waitFor(() => expect(putCVData).toHaveBeenCalled());
  });
});
