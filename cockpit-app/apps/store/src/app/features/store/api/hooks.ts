import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getStorePrefixes,
  getStoreCategories,
  getStoreKeys,
  getStoreEntry,
  createOrUpdateStoreEntry,
  deleteStoreEntry,
} from './api';
import type { StoreWriteRequest } from './schemas';

export function useStorePrefixes() {
  return useQuery({
    queryKey: ['store', 'prefixes'],
    queryFn: getStorePrefixes,
  });
}

export function useStoreCategories(prefix: string) {
  return useQuery({
    queryKey: ['store', 'categories', prefix],
    queryFn: () => getStoreCategories(prefix),
    enabled: prefix.length > 0,
  });
}

export function useStoreKeys(prefix: string, category: string) {
  return useQuery({
    queryKey: ['store', 'keys', prefix, category],
    queryFn: () => getStoreKeys(prefix, category),
    enabled: prefix.length > 0 && category.length > 0,
  });
}

export function useStoreEntry(prefix: string, category: string, key: string) {
  return useQuery({
    queryKey: ['store', 'entry', prefix, category, key],
    queryFn: () => getStoreEntry(prefix, category, key),
    enabled: prefix.length > 0 && category.length > 0 && key.length > 0,
  });
}

export function useCreateOrUpdateStoreEntry() {
  return useMutation({
    mutationFn: ({
      prefix,
      category,
      key,
      body,
    }: {
      prefix: string;
      category: string;
      key: string;
      body: StoreWriteRequest;
    }) => createOrUpdateStoreEntry(prefix, category, key, body),
  });
}

export function useDeleteStoreEntry() {
  return useMutation({
    mutationFn: ({
      prefix,
      category,
      key,
    }: {
      prefix: string;
      category: string;
      key: string;
    }) => deleteStoreEntry(prefix, category, key),
  });
}
