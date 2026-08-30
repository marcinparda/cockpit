export interface EnvelopeMeta {
  key: string;
  type: string;
  version: number;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface Envelope<T = unknown> {
  meta: EnvelopeMeta;
  data: T;
}

export function createEnvelopeMock<T = unknown>(
  overrides: Partial<Envelope<T>> = {},
): Envelope<T> {
  return {
    meta: {
      key: 'k',
      type: 't',
      version: 1,
      created_at: '',
      updated_at: '',
      tags: [],
    },
    data: {} as T,
    ...overrides,
  };
}
