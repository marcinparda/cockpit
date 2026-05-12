import { vi, describe, it, expect, beforeEach } from 'vitest';

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

import { getCVData, putCVData } from './cvStoreApi';

const mockEnvelope = {
  meta: { key: 'k', type: 't', version: 1, created_at: '', updated_at: '', tags: [] },
  data: { name: 'test' },
};

describe('cvStoreApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getRequest for each CV section on getCVData', async () => {
    mockGetRequest.mockResolvedValue(mockEnvelope);
    await getCVData('base');
    expect(mockGetRequest).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/store/base/cv/'),
      expect.anything(),
    );
  });

  it('should return null when all sections return 404', async () => {
    mockGetRequest.mockRejectedValue(new Error('HTTP 404: Not Found'));
    const result = await getCVData('base');
    expect(result).toBeNull();
  });

  it('should call putRequest for each CV section on putCVData', async () => {
    mockPutRequest.mockResolvedValue(mockEnvelope);
    const mockCVData = {
      header: {}, summary: {}, skills: {}, achievements: {},
      experience: {}, education: {}, personalProjects: {}, courses: {},
    } as never;

    await putCVData(mockCVData, 'base');
    expect(mockPutRequest).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/store/base/cv/'),
      expect.anything(),
      expect.anything(),
    );
  });
});
