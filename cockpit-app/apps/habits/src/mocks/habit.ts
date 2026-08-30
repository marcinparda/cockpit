import type { Habit } from '../api/schemas';

export function createHabitMock(overrides: Partial<Habit> = {}): Habit {
  return {
    id: crypto.randomUUID(),
    name: 'Morning Run',
    icon: 'Running',
    color: '#ff6b6b',
    type: 'boolean',
    streak_mode: 'soft',
    current_streak: 3,
    best_streak: 5,
    frequency: 'daily',
    is_active: true,
    is_archived: false,
    category_id: null,
    category_name: undefined,
    sort_order: 0,
    ...overrides,
  };
}
