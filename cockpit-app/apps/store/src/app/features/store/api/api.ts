import { z } from 'zod';
import { baseApi } from '@cockpit-app/common-shared-data-access';
import { STORE_ENDPOINTS } from './endpoints';
import {
  storeEnvelopeSchema,
  storePrefixesSchema,
  storeCategoriesSchema,
  storeKeysSchema,
  type StoreEnvelope,
  type StoreWriteRequest,
} from './schemas';

export function getStorePrefixes(): Promise<string[]> {
  return baseApi.getRequest(STORE_ENDPOINTS.prefixes(), storePrefixesSchema);
}

export function getStoreCategories(prefix: string): Promise<string[]> {
  return baseApi.getRequest(STORE_ENDPOINTS.categories(prefix), storeCategoriesSchema);
}

export function getStoreKeys(prefix: string, category: string): Promise<string[]> {
  return baseApi.getRequest(STORE_ENDPOINTS.keys(prefix, category), storeKeysSchema);
}

export function getStoreEntry(
  prefix: string,
  category: string,
  key: string,
): Promise<StoreEnvelope> {
  return baseApi.getRequest(STORE_ENDPOINTS.entry(prefix, category, key), storeEnvelopeSchema);
}

export function resolveStoreEntry(
  prefix: string,
  category: string,
  key: string,
): Promise<StoreEnvelope> {
  return baseApi.getRequest(STORE_ENDPOINTS.resolve(prefix, category, key), storeEnvelopeSchema);
}

export function createOrUpdateStoreEntry(
  prefix: string,
  category: string,
  key: string,
  body: StoreWriteRequest,
): Promise<StoreEnvelope> {
  return baseApi.putRequest(
    STORE_ENDPOINTS.entry(prefix, category, key),
    storeEnvelopeSchema,
    body,
  );
}

export function deleteStoreEntry(prefix: string, category: string, key: string): Promise<void> {
  return baseApi.deleteRequest(STORE_ENDPOINTS.entry(prefix, category, key), z.void());
}
