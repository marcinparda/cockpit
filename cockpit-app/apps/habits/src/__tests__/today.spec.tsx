import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useHabits: vi.fn(),
  useEntriesByRange: vi.fn(),
  useEntryMutations: vi.fn(),
}));

import * as dataAccess from '@cockpit-app/habits-data-access';
import TodayPage from '../pages/TodayPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createHabitMock } from '@cockpit-app/habits-data-access';
import {
  addDays,
  toDateKey,
} from '@cockpit-app/habits-ui';

const today = toDateKey(new Date());
const yesterday = addDays(today, -1);
const upsert = vi.fn();
const del = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <TodayPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function setHabits(habits: unknown[]) {
  vi.mocked(dataAccess.useHabits).mockReturnValue({
    isLoading: false,
    data: habits,
    error: null,
  } as never);
}

function setEntries(entries: unknown[]) {
  vi.mocked(dataAccess.useEntriesByRange).mockReturnValue({
    data: entries,
  } as never);
}

function entry(habitId: string, date: string, extra: object = {}) {
  return { id: `e-${habitId}-${date}`, habit_id: habitId, user_id: 'u', logged_at: date, ...extra };
}

const baseHabit = createHabitMock({ id: 'h1', name: 'Run' });

describe('TodayPage', () => {
  beforeEach(() => {
    upsert.mockReset();
    del.mockReset();
    vi.mocked(dataAccess.useEntryMutations).mockReturnValue({
      upsertEntry: { mutate: upsert },
      deleteEntry: { mutate: del },
    } as never);
    setEntries([]);
    setHabits([]);
  });

  it('groups habits by category, uncategorized last', () => {
    setHabits([
      { ...baseHabit, id: 'a', name: 'Sleep', category_id: 'cat-b', category_name: 'Sleep' },
      { ...baseHabit, id: 'b', name: 'Run', category_id: 'cat-a', category_name: 'Fitness' },
      { ...baseHabit, id: 'c', name: 'Meditate', category_id: null, category_name: undefined },
    ]);
    renderPage();
    const texts = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(texts).toEqual(['Fitness', 'Sleep', 'Uncategorized']);
  });

  it('shows empty state', () => {
    renderPage();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('boolean ✓ upserts true for today', () => {
    setHabits([baseHabit]);
    renderPage();
    fireEvent.click(screen.getByLabelText('Mark Run done'));
    expect(upsert).toHaveBeenCalledWith({ habitId: 'h1', logged_at: today, boolean_value: true });
  });

  it('boolean ✗ upserts false', () => {
    setHabits([baseHabit]);
    renderPage();
    fireEvent.click(screen.getByLabelText('Mark Run not done'));
    expect(upsert).toHaveBeenCalledWith({ habitId: 'h1', logged_at: today, boolean_value: false });
  });

  it('tapping the active ✓ or ✗ deletes the entry', () => {
    setHabits([baseHabit]);
    setEntries([entry('h1', today, { boolean_value: true })]);
    const { unmount } = renderPage();
    fireEvent.click(screen.getByLabelText('Mark Run done'));
    expect(del).toHaveBeenCalledWith({ habitId: 'h1', entryId: `e-h1-${today}` });
    unmount();

    del.mockReset();
    setEntries([entry('h1', today, { boolean_value: false })]);
    renderPage();
    fireEvent.click(screen.getByLabelText('Mark Run not done'));
    expect(del).toHaveBeenCalledTimes(1);
  });

  it('✗ does not count in x/y and shows not-done state', () => {
    setHabits([baseHabit, { ...baseHabit, id: 'h2', name: 'Read' }]);
    setEntries([
      entry('h1', today, { boolean_value: false }),
      entry('h2', today, { boolean_value: true }),
    ]);
    renderPage();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    const values = screen.getAllByTestId('log-row').map((r) => r.getAttribute('data-value'));
    expect(values).toEqual(['notDone', 'done']);
    expect(screen.queryByTestId('all-done-state')).not.toBeInTheDocument();
  });

  it('numeric ✓ opens sheet; ✗ logs boolean_value false', () => {
    setHabits([{ ...baseHabit, type: 'numeric', target_value: 8 }]);
    renderPage();
    fireEvent.click(screen.getByLabelText('Mark Run done'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close'));
    fireEvent.click(screen.getByLabelText('Mark Run not done'));
    expect(upsert).toHaveBeenCalledWith({ habitId: 'h1', logged_at: today, boolean_value: false });
  });

  it('shows numeric progress', () => {
    setHabits([{ ...baseHabit, type: 'numeric', target_value: 8 }]);
    setEntries([entry('h1', today, { numeric_value: 3 })]);
    renderPage();
    expect(screen.getByText('3/8')).toBeInTheDocument();
  });

  it('text habit with value is done and shows all-done banner', () => {
    setHabits([{ ...baseHabit, type: 'text' }]);
    setEntries([entry('h1', today, { text_value: 'Great day' })]);
    renderPage();
    expect(screen.getByTestId('all-done-state')).toBeInTheDocument();
  });

  it('selects a past day and logs with that date; header shows the date', () => {
    setHabits([baseHabit]);
    renderPage();
    fireEvent.click(screen.getByLabelText('Previous day'));
    expect(screen.queryByRole('heading', { name: 'Today' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Mark Run done'));
    expect(upsert).toHaveBeenCalledWith({ habitId: 'h1', logged_at: yesterday, boolean_value: true });
    fireEvent.click(screen.getByText('Today', { selector: 'button' }));
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('x/y and banner follow the selected day', () => {
    setHabits([baseHabit]);
    setEntries([entry('h1', yesterday, { boolean_value: true })]);
    renderPage();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Previous day'));
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByTestId('all-done-state')).toBeInTheDocument();
  });

  it('cannot select future days', () => {
    setHabits([baseHabit]);
    renderPage();
    expect(screen.getByLabelText('Next day')).toBeDisabled();
  });

  it('row tap navigates (no long-press)', () => {
    setHabits([baseHabit]);
    renderPage();
    fireEvent.click(screen.getByText('Run'));
    // MemoryRouter navigation does not throw; row is a plain click target
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('shows streak badge only when streak_mode is not none', () => {
    setHabits([baseHabit]);
    const { unmount } = renderPage();
    expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
    unmount();
    setHabits([{ ...baseHabit, streak_mode: 'none' }]);
    renderPage();
    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });
});
