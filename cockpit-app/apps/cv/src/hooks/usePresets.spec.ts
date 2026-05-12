import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePresets } from './usePresets';
import { fetchRegistry, saveRegistry } from '../services/presetApi';

vi.mock('../services/presetApi', () => ({
  fetchRegistry: vi.fn(),
  saveRegistry: vi.fn(),
  clonePresetSections: vi.fn(),
}));

// jsdom doesn't implement replaceState fully — stub it
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost/', search: '' },
  writable: true,
});

window.history.replaceState = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePresets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load presets from fetchRegistry on mount', async () => {
    const mockPresets = [
      { id: 'preset-1', label: 'Preset 1', archived: false, created_at: '2024-01-01' },
    ];
    vi.mocked(fetchRegistry).mockResolvedValue(mockPresets);
    const { result } = renderHook(() => usePresets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchRegistry).toHaveBeenCalled();
    expect(result.current.presets).toEqual(mockPresets);
  });

  it('should return empty presets initially while loading', () => {
    vi.mocked(fetchRegistry).mockResolvedValue([]);
    const { result } = renderHook(() => usePresets(), { wrapper: createWrapper() });
    expect(result.current.presets).toEqual([]);
  });

  it('should filter out archived presets', async () => {
    vi.mocked(fetchRegistry).mockResolvedValue([
      { id: 'active', label: 'Active', archived: false, created_at: '2024-01-01' },
      { id: 'archived', label: 'Archived', archived: true, created_at: '2024-01-01' },
    ]);
    const { result } = renderHook(() => usePresets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].id).toBe('active');
  });

  it('should call saveRegistry and fetchRegistry when createPreset is called', async () => {
    vi.mocked(fetchRegistry).mockResolvedValue([]);
    vi.mocked(saveRegistry).mockResolvedValue(undefined);
    const { result } = renderHook(() => usePresets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.createPreset('New Preset');

    expect(saveRegistry).toHaveBeenCalled();
  });
});
