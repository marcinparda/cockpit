import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchRegistry, saveRegistry, fetchPresetSection, savePresetSection } from './presetApi';

const { mockGetRequest, mockPutRequest } = vi.hoisted(() => ({
  mockGetRequest: vi.fn(),
  mockPutRequest: vi.fn(),
}));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  baseApi: {
    getRequest: mockGetRequest,
    putRequest: mockPutRequest,
  },
}));

const mockEnvelope = {
  meta: { key: 'k', type: 't', version: 1, created_at: '', updated_at: '', tags: [] },
  data: [{ id: 'preset-1', label: 'Preset 1', archived: false, created_at: '2024-01-01' }],
};

describe('presetApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getRequest with registry endpoint on fetchRegistry', async () => {
    mockGetRequest.mockResolvedValue(mockEnvelope);
    await fetchRegistry();
    expect(mockGetRequest).toHaveBeenCalledWith(
      '/api/v1/store/registry/cv/presets',
      expect.anything(),
    );
  });

  it('should return empty array when registry returns 404', async () => {
    mockGetRequest.mockRejectedValue(new Error('HTTP 404: Not Found'));
    const result = await fetchRegistry();
    expect(result).toEqual([]);
  });

  it('should call putRequest with registry endpoint on saveRegistry', async () => {
    mockPutRequest.mockResolvedValue(mockEnvelope);
    await saveRegistry([]);
    expect(mockPutRequest).toHaveBeenCalledWith(
      '/api/v1/store/registry/cv/presets',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should call getRequest with correct preset section endpoint', async () => {
    mockGetRequest.mockResolvedValue({ ...mockEnvelope, data: { items: [] } });
    await fetchPresetSection('my-preset', 'header');
    expect(mockGetRequest).toHaveBeenCalledWith(
      '/api/v1/store/my-preset/cv/header',
      expect.anything(),
    );
  });

  it('should call putRequest with correct preset section endpoint on savePresetSection', async () => {
    mockPutRequest.mockResolvedValue(mockEnvelope);
    await savePresetSection('my-preset', 'skills', { items: [] });
    expect(mockPutRequest).toHaveBeenCalledWith(
      '/api/v1/store/my-preset/cv/skills',
      expect.anything(),
      expect.anything(),
    );
  });
});
