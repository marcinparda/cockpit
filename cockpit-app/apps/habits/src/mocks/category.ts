import type { HabitCategory } from '../api/schemas';

export function createCategoryMock(overrides: Partial<HabitCategory> = {}): HabitCategory {
  return {
    id: crypto.randomUUID(),
    name: 'Health',
    color: '#22c55e',
    ...overrides,
  };
}
