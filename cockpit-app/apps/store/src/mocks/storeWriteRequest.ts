import type { StoreWriteRequest } from '../app/features/store/api/schemas';

export function createStoreWriteRequestMock(
  overrides: Partial<StoreWriteRequest> = {}
): StoreWriteRequest {
  return {
    type: 'object',
    tags: [],
    data: { value: 42 },
    ...overrides,
  };
}
