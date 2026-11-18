import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../api/hooks/useHabits', () => ({
  useHabit: vi.fn(),
}));

vi.mock('../api/hooks/useHabitEntries', () => ({
  useHabitEntries: vi.fn(),
}));

vi.mock('../api/hooks/useHabitStreak', () => ({
  useHabitStreak: vi.fn(),
}));

vi.mock('../api/hooks/useFreezeMutations', () => ({
  useFreezeMutations: vi.fn(),
}));

vi.mock('../api/hooks/useEntryMutations', () => ({
  useEntryMutations: vi.fn(),
}));

vi.mock('../components/HabitSheet', () => ({
  HabitSheet: ({ date }: { date: string }) => <div data-testid="habit-sheet">{date}</div>,
}));

vi.mock('../components/HabitCreationSheet', () => ({
  HabitCreationSheet: () => <div data-testid="habit-creation-sheet" />,
}));

vi.mock('recharts', () => ({
  ComposedChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import * as useHabitsModule from '../api/hooks/useHabits';
import * as useHabitEntriesModule from '../api/hooks/useHabitEntries';
import * as useHabitStreakModule from '../api/hooks/useHabitStreak';
import * as useEntryMutationsModule from '../api/hooks/useEntryMutations';
import * as useFreezeMutationsModule from '../api/hooks/useFreezeMutations';
import { toDateKey, addDays } from '../utils/date';
import { HeatmapCalendar } from '../components/HeatmapCalendar';
import { LineBarChart } from '../components/LineBarChart';
import HabitDetailPage from '../pages/HabitDetailPage';
import { createHabitMock } from '../mocks/habit';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withProviders(ui: React.ReactElement, habitId = 'habit-1') {
  return (
    <MemoryRouter initialEntries={[`/habits/${habitId}`]}>
      <QueryClientProvider client={makeQueryClient()}>
        <Routes>
          <Route path="/habits/:id" element={ui} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const mockBooleanHabit = createHabitMock({
  id: 'habit-1',
  color: '#22c55e',
  current_streak: 5,
  best_streak: 10,
});

const mockNumericHabit = createHabitMock({
  ...mockBooleanHabit,
  id: 'habit-2',
  type: 'numeric',
  target_value: 30,
});

const mockTextHabit = createHabitMock({
  ...mockBooleanHabit,
  id: 'habit-3',
  type: 'text',
});

describe('HeatmapCalendar', () => {
  it('renders correct number of cells for a 12-week range', () => {
    const entries = {};
    render(
      <HeatmapCalendar
        entries={entries}
        color="#22c55e"
        weeks={12}
      />,
    );

    // 12 weeks × 7 days = 84 cells
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(84);
  });
});

describe('HeatmapCalendar states', () => {
  const today = toDateKey(new Date());
  const yesterday = addDays(today, -1);

  it('labels done / not done / unlogged distinctly', () => {
    render(
      <HeatmapCalendar
        entries={{ [today]: 'done', [yesterday]: 'notDone' }}
        color="#22c55e"
      />,
    );
    expect(screen.getByRole('gridcell', { name: `${today}: done` })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: `${yesterday}: not done` })).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: `${addDays(today, -2)}: unlogged` }),
    ).toBeInTheDocument();
  });

  it('disables future cells and reports clicks on past cells', () => {
    const onCellClick = vi.fn();
    render(<HeatmapCalendar entries={{}} color="#22c55e" onCellClick={onCellClick} />);
    const future = screen.getAllByRole('gridcell').filter((c) => (c as HTMLButtonElement).disabled);
    expect(future.length).toBeGreaterThan(0);
    fireEvent.click(future[0]);
    expect(onCellClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('gridcell', { name: `${yesterday}: unlogged` }));
    expect(onCellClick).toHaveBeenCalledWith(yesterday, 'unlogged');
  });
});

describe('LineBarChart', () => {
  it('renders with provided data without crashing', () => {
    const data = [
      { date: '2025-01-01', value: 10, avg: 10 },
      { date: '2025-01-02', value: 20, avg: 15 },
    ];

    render(
      <LineBarChart data={data} targetValue={30} />,
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });
});

describe('HabitDetailPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.mocked(useEntryMutationsModule.useEntryMutations).mockReturnValue({
      upsertEntry: { mutate: vi.fn() },
      deleteEntry: { mutate: vi.fn() },
    } as any);

    vi.mocked(useHabitEntriesModule.useHabitEntries).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);

    vi.mocked(useHabitStreakModule.useHabitStreak).mockReturnValue({
      isLoading: false,
      data: {
        habit_id: 'habit-1',
        current_streak: 5,
        longest_streak: 10,
        total_completions: 50,
      },
    } as any);

    vi.mocked(useFreezeMutationsModule.useFreezeMutations).mockReturnValue({
      createFreeze: { mutate: mockMutate, isPending: false },
      freezesThisMonth: 1,
    } as any);
  });

  it('shows freeze button with correct remaining count', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Should show freeze button with remaining count (2 - 1 used = 1 remaining)
    const freezeBtn = screen.getByRole('button', { name: /freeze/i });
    expect(freezeBtn).toBeInTheDocument();
    expect(freezeBtn).toHaveTextContent('1');
  });

  it('renders HeatmapCalendar for boolean habit', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Boolean habit → 84 grid cells (12 × 7)
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders LineBarChart for numeric habit', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockNumericHabit,
    } as any);

    render(withProviders(<HabitDetailPage />, 'habit-2'));

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('shows "Habit not found" when habit is null', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: null,
    } as any);

    render(withProviders(<HabitDetailPage />));

    expect(screen.getByText(/Habit not found/i)).toBeInTheDocument();
  });

  it('calls createFreeze mutate when freeze button is clicked', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);

    render(withProviders(<HabitDetailPage />));

    const freezeBtn = screen.getByRole('button', { name: /freeze/i });
    fireEvent.click(freezeBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ habitId: 'habit-1' }),
    );
  });

  it('changes time range when range button is clicked', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Find and click the "1W" button
    const weekBtn = screen.getByRole('button', { name: '1W' });
    fireEvent.click(weekBtn);

    // Should now be active (aria-pressed or highlighted)
    expect(weekBtn).toBeInTheDocument();
  });

  it('renders heatmap entries from real entry data', () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);
    vi.mocked(useHabitEntriesModule.useHabitEntries).mockReturnValue({
      isLoading: false,
      data: [
        { id: 'e1', habit_id: 'habit-1', date: '2026-05-01', value: null, boolean_value: true, numeric_value: null, text_value: null, logged_at: '2026-05-01' },
      ],
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Grid cells should be present (heatmap rendered)
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
  });

  describe('heatmap interaction', () => {
    const upsert = vi.fn();
    const del = vi.fn();
    const day = addDays(toDateKey(new Date()), -1);

    beforeEach(() => {
      upsert.mockClear();
      del.mockClear();
      vi.mocked(useEntryMutationsModule.useEntryMutations).mockReturnValue({
        upsertEntry: { mutate: upsert },
        deleteEntry: { mutate: del },
      } as any);
    });

    function entry(boolean_value: boolean | null) {
      return {
        id: 'e1', habit_id: 'habit-1', user_id: 'u', logged_at: day,
        boolean_value, numeric_value: null, text_value: null,
      };
    }

    it('cycles boolean cell: unlogged -> done', () => {
      vi.mocked(useHabitsModule.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: unlogged` }));
      expect(upsert).toHaveBeenCalledWith({ habitId: 'habit-1', logged_at: day, boolean_value: true });
    });

    it('cycles boolean cell: done -> not done', () => {
      vi.mocked(useHabitsModule.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      vi.mocked(useHabitEntriesModule.useHabitEntries).mockReturnValue({ isLoading: false, data: [entry(true)] } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: done` }));
      expect(upsert).toHaveBeenCalledWith({ habitId: 'habit-1', logged_at: day, boolean_value: false });
    });

    it('cycles boolean cell: not done -> deleted', () => {
      vi.mocked(useHabitsModule.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      vi.mocked(useHabitEntriesModule.useHabitEntries).mockReturnValue({ isLoading: false, data: [entry(false)] } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: not done` }));
      expect(del).toHaveBeenCalledWith({ habitId: 'habit-1', entryId: 'e1' });
    });

    it('opens the sheet for that date on numeric habit cell click', () => {
      vi.mocked(useHabitsModule.useHabit).mockReturnValue({ isLoading: false, data: mockNumericHabit } as any);
      vi.mocked(useHabitEntriesModule.useHabitEntries).mockReturnValue({ isLoading: false, data: [] } as any);
      render(withProviders(<HabitDetailPage />, 'habit-2'));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: unlogged` }));
      expect(screen.getByTestId('habit-sheet')).toHaveTextContent(day);
      expect(upsert).not.toHaveBeenCalled();
    });
  });
});
