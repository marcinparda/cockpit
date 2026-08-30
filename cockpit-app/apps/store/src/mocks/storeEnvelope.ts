import type { StoreEnvelope } from '../app/features/store/api/schemas';
import { createStoreMetaMock } from './storeMeta';

export function createStoreEnvelopeMock(overrides: Partial<StoreEnvelope> = {}): StoreEnvelope {
  return {
    meta: createStoreMetaMock(),
    data: { hello: 'world' },
    ...overrides,
  };
}
