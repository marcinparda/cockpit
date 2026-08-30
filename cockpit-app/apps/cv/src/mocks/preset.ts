import type { Preset } from '../types/preset.types';

export function createPresetMock(overrides: Partial<Preset> = {}): Preset {
  return {
    id: crypto.randomUUID(),
    label: 'Preset',
    description: '',
    created_at: '2024-01-01T00:00:00Z',
    archived: false,
    ...overrides,
  };
}
