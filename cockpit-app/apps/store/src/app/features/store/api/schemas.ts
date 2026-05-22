import { z } from 'zod';

export const storeMetaSchema = z.object({
  key: z.string(),
  type: z.string(),
  version: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()),
});

export const storeEnvelopeSchema = z.object({
  meta: storeMetaSchema,
  data: z.unknown(),
});

export const storeWriteRequestSchema = z.object({
  type: z.string(),
  tags: z.array(z.string()).optional(),
  data: z.unknown(),
});

export const storePrefixesSchema = z.array(z.string());
export const storeCategoriesSchema = z.array(z.string());
export const storeKeysSchema = z.array(z.string());

export type StoreMeta = z.infer<typeof storeMetaSchema>;
export type StoreEnvelope = z.infer<typeof storeEnvelopeSchema>;
export type StoreWriteRequest = z.infer<typeof storeWriteRequestSchema>;
