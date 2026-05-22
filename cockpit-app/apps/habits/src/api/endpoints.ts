export const HABITS_ENDPOINTS = {
  LIST: '/api/v1/habits',
  DETAIL: (id: string) => `/api/v1/habits/${id}`,
  CREATE: '/api/v1/habits',
  UPDATE: (id: string) => `/api/v1/habits/${id}`,
  DELETE: (id: string) => `/api/v1/habits/${id}`,
} as const;

export const CATEGORIES_ENDPOINTS = {
  LIST: '/api/v1/habits/categories',
  DETAIL: (id: string) => `/api/v1/habits/categories/${id}`,
  CREATE: '/api/v1/habits/categories',
  UPDATE: (id: string) => `/api/v1/habits/categories/${id}`,
  DELETE: (id: string) => `/api/v1/habits/categories/${id}`,
} as const;

export const ENTRIES_ENDPOINTS = {
  BY_HABIT: (habitId: string) => `/api/v1/habits/${habitId}/entries`,
  UPSERT: (habitId: string) => `/api/v1/habits/${habitId}/entries`,
  DELETE_ENTRY: (habitId: string, entryId: string) =>
    `/api/v1/habits/${habitId}/entries/${entryId}`,
} as const;

export const STATS_ENDPOINTS = {
  STREAK: (habitId: string) => `/api/v1/habits/${habitId}/streak`,
  STATS: '/api/v1/habits/stats',
} as const;

export const SETTINGS_ENDPOINTS = {
  GET: '/api/v1/habits/settings',
  UPDATE: '/api/v1/habits/settings',
  VAPID_PUBLIC_KEY: '/api/v1/habits/settings/vapid-public-key',
} as const;

export const PRESETS_ENDPOINTS = {
  LIST: '/api/v1/presets',
} as const;
