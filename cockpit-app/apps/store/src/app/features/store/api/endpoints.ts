export const STORE_ENDPOINTS = {
  prefixes: () => '/api/v1/store/',
  categories: (prefix: string) => `/api/v1/store/${prefix}`,
  keys: (prefix: string, category: string) => `/api/v1/store/${prefix}/${category}`,
  entry: (prefix: string, category: string, key: string) =>
    `/api/v1/store/${prefix}/${category}/${key}`,
  resolve: (prefix: string, category: string, key: string) =>
    `/api/v1/store/resolve/${prefix}/${category}/${key}`,
} as const;
