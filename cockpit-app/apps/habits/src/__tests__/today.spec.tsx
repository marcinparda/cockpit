import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock TanStack Query hooks used by components
vi.mock('../api/hooks/useHabits', () => ({
  useHabits: vi.fn(),
}));

vi.mock('../api/hooks/useEntryMutations', () => ({
  useEntryMutations: vi.fn(() => ({
    upsertEntry: { mutate: vi.fn() },
    deleteEntry: { mutate: vi.fn() },
  })),
}));

// Must import after vi.mock declarations
import * as useHabitsModule from '../api/hooks/useHabits';
import { HabitTile } from '../components/HabitTile';
import TodayPage from '../pages/TodayPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withQueryClient(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

const baseHabit = {
  id: 'habit-1',
  name: 'Morning Run',
  icon: 'Running',
  color: '#ff6b6b',
  type: 'boolean' as const,
  streak_mode: 'soft' as const,
  current_streak: 3,
  frequency: 'daily',
  is_active: true,
  category_id: null,
  sort_order: 0,
  is_archived: false,
  best_streak: 5,
};

describe('HabitTile', () => {
  it('renders with habit.color as border when uncompleted', () => {
    render(
      withQueryClient(
        <HabitTile habit={baseHabit} completed={false} todayEntry={null} />,
      ),
    );
    const tile = screen.getByRole('button');
    expect(tile).toHaveStyle({ borderColor: '#ff6b6b' });
  });

  it('shows streak badge only when streak_mode is not none', () => {
    const { rerender } = render(
      withQueryClient(
        <HabitTile habit={baseHabit} completed={false} todayEntry={null} />,
      ),
    );
    // streak_mode = 'soft' + current_streak = 3 → badge visible
    expect(screen.getByTestId('streak-badge')).toBeInTheDocument();

    const noStreakHabit = { ...baseHabit, streak_mode: 'none' as const };
    rerender(
      withQueryClient(
        <HabitTile
          habit={noStreakHabit}
          completed={false}
          todayEntry={null}
        />,
      ),
    );
    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });

  it('applies completed state: filled background + checkmark class', () => {
    render(
      withQueryClient(
        <HabitTile habit={baseHabit} completed={true} todayEntry={null} />,
      ),
    );
    const tile = screen.getByRole('button');
    expect(tile).toHaveStyle({ backgroundColor: '#ff6b6b' });
    expect(tile.querySelector('[data-testid="checkmark"]')).toBeInTheDocument();
  });
});

describe('TodayPage', () => {
  beforeEach(() => {
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: undefined,
      error: null,
    } as any);
  });

  it('groups habits by category in correct order', () => {
    const habits = [
      { ...baseHabit, id: 'h1', name: 'Sleep', category_id: 'cat-b', category_name: 'Sleep' },
      { ...baseHabit, id: 'h2', name: 'Run', category_id: 'cat-a', category_name: 'Fitness' },
      { ...baseHabit, id: 'h3', name: 'Walk', category_id: 'cat-a', category_name: 'Fitness' },
      { ...baseHabit, id: 'h4', name: 'Meditate', category_id: null, category_name: undefined },
    ];
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: habits,
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);
    const fitnessIdx = headingTexts.findIndex((t) => t?.includes('Fitness'));
    const sleepIdx = headingTexts.findIndex((t) => t?.includes('Sleep'));
    const uncatIdx = headingTexts.findIndex((t) => t?.includes('Uncategorized'));

    // Categories with IDs appear before uncategorized
    expect(fitnessIdx).toBeGreaterThanOrEqual(0);
    expect(sleepIdx).toBeGreaterThanOrEqual(0);
    expect(uncatIdx).toBeGreaterThanOrEqual(0);
    expect(uncatIdx).toBeGreaterThan(fitnessIdx);
    expect(uncatIdx).toBeGreaterThan(sleepIdx);
  });

  it('shows empty state when habits array is empty', () => {
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('marks numeric habit as completed when numeric_value is set', () => {
    const today = new Date().toISOString().split('T')[0];
    const habits = [
      {
        ...baseHabit,
        id: 'h1',
        type: 'numeric' as const,
        is_active: true,
        today_entry: { id: 'e1', habit_id: 'h1', logged_at: today, boolean_value: null, numeric_value: 5, text_value: null },
      },
    ];
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: habits,
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    // All-done state should appear since the only habit is completed
    expect(screen.getByTestId('all-done-state')).toBeInTheDocument();
  });

  it('marks text habit as completed when text_value is set', () => {
    const today = new Date().toISOString().split('T')[0];
    const habits = [
      {
        ...baseHabit,
        id: 'h1',
        type: 'text' as const,
        is_active: true,
        today_entry: { id: 'e1', habit_id: 'h1', logged_at: today, boolean_value: null, numeric_value: null, text_value: 'Great day' },
      },
    ];
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: habits,
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    expect(screen.getByTestId('all-done-state')).toBeInTheDocument();
  });

  it('shows tile and opens HabitSheet for numeric habit on click', () => {
    const habits = [
      {
        ...baseHabit,
        id: 'h1',
        type: 'numeric' as const,
        is_active: true,
        today_entry: null,
      },
    ];
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: habits,
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    const tile = screen.getByRole('button');
    fireEvent.click(tile);

    // HabitSheet should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows all-done state when all habits have entries for today', () => {
    const today = new Date().toISOString().split('T')[0];
    const habits = [
      {
        ...baseHabit,
        id: 'h1',
        today_entry: { id: 'e1', habit_id: 'h1', logged_at: today, boolean_value: true },
      },
      {
        ...baseHabit,
        id: 'h2',
        name: 'Meditate',
        today_entry: { id: 'e2', habit_id: 'h2', logged_at: today, boolean_value: true },
      },
    ];
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      isLoading: false,
      data: habits,
      error: null,
    } as any);

    render(withQueryClient(<TodayPage />));

    expect(screen.getByTestId('all-done-state')).toBeInTheDocument();
  });
});
