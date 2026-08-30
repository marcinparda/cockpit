import type { StoreMeta } from '../app/features/store/api/schemas';

export function createStoreMetaMock(overrides: Partial<StoreMeta> = {}): StoreMeta {
  return {
    key: 'myprefix:mycategory:mykey',
    type: 'object',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: ['tagA', 'tagB'],
    ...overrides,
  };
}
