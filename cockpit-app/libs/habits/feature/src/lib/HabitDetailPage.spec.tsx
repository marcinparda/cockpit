import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as dataAccess from '@cockpit-app/habits-data-access';
import { addDays, heatmapRange, toDateKey } from '@cockpit-app/habits-ui';
import { HabitDetailPage } from './HabitDetailPage';
import { createHabitMock } from '@cockpit-app/habits-data-access';

vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useHabit: vi.fn(),
  useHabitEntries: vi.fn(),
  useHabitStreak: vi.fn(),
  useFreezeMutations: vi.fn(),
  useEntryMutations: vi.fn(),
}));

vi.mock('./HabitSheet', () => ({
  HabitSheet: ({ date }: { date: string }) => <div data-testid="habit-sheet">{date}</div>,
}));

vi.mock('./HabitCreationSheet', () => ({
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

/** Cheap whole-heatmap cell query; role queries are slow in jsdom. */
const gridCells = () =>
  document.querySelectorAll('[role="grid"][aria-label="Habit completion heatmap"] [role="gridcell"]');

/** Days after today in the current Sun–Sat week are not rendered. */
const FUTURE_DAYS_THIS_WEEK = 6 - new Date().getDay();

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

describe('HabitDetailPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.mocked(dataAccess.useEntryMutations).mockReturnValue({
      upsertEntry: { mutate: vi.fn() },
      deleteEntry: { mutate: vi.fn() },
    } as any);

    vi.mocked(dataAccess.useHabitEntries).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);

    vi.mocked(dataAccess.useHabitStreak).mockReturnValue({
      isLoading: false,
      data: {
        habit_id: 'habit-1',
        current_streak: 5,
        longest_streak: 10,
        total_completions: 50,
      },
    } as any);

    vi.mocked(dataAccess.useFreezeMutations).mockReturnValue({
      createFreeze: { mutate: mockMutate, isPending: false },
      freezesThisMonth: 1,
    } as any);
  });

  it('shows freeze button with correct remaining count', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({
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
    vi.mocked(dataAccess.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Boolean habit → heatmap cells rendered (default 1Y = 52 weeks)
    expect(gridCells().length).toBeGreaterThan(0);
  });

  it('renders LineBarChart for numeric habit', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({
      isLoading: false,
      data: mockNumericHabit,
    } as any);

    render(withProviders(<HabitDetailPage />, 'habit-2'));

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('shows "Habit not found" when habit is null', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({
      isLoading: false,
      data: null,
    } as any);

    render(withProviders(<HabitDetailPage />));

    expect(screen.getByText(/Habit not found/i)).toBeInTheDocument();
  });

  it('calls createFreeze mutate when freeze button is clicked', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({
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

  it('offers the periods 6M, 1Y, defaulting to 1Y', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
    render(withProviders(<HabitDetailPage />));
    const labels = within(screen.getByRole('group', { name: 'Time range' }))
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(labels).toEqual(['6M', '1Y']);
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true');
    expect(gridCells()).toHaveLength(52 * 7 - FUTURE_DAYS_THIS_WEEK);
  });

  it.each([
    ['6M', 26],
    ['1Y', 52],
  ] as const)('period %s shows %i weeks of cells and fetches that range', (label, weeks) => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
    render(withProviders(<HabitDetailPage />));

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(gridCells()).toHaveLength(weeks * 7 - FUTURE_DAYS_THIS_WEEK);
    const range = heatmapRange(weeks);
    expect(dataAccess.useHabitEntries).toHaveBeenLastCalledWith('habit-1', range);
  });

  it('renders heatmap entries from real entry data', () => {
    vi.mocked(dataAccess.useHabit).mockReturnValue({
      isLoading: false,
      data: mockBooleanHabit,
    } as any);
    vi.mocked(dataAccess.useHabitEntries).mockReturnValue({
      isLoading: false,
      data: [
        { id: 'e1', habit_id: 'habit-1', date: '2026-05-01', value: null, boolean_value: true, numeric_value: null, text_value: null, logged_at: '2026-05-01' },
      ],
    } as any);

    render(withProviders(<HabitDetailPage />));

    // Grid cells should be present (heatmap rendered)
    expect(gridCells().length).toBeGreaterThan(0);
  });

  describe('heatmap interaction', () => {
    const upsert = vi.fn();
    const del = vi.fn();
    const day = addDays(toDateKey(new Date()), -1);

    beforeEach(() => {
      upsert.mockClear();
      del.mockClear();
      vi.mocked(dataAccess.useEntryMutations).mockReturnValue({
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
      vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: unlogged` }));
      expect(upsert).toHaveBeenCalledWith({ habitId: 'habit-1', logged_at: day, boolean_value: true });
    });

    it('cycles boolean cell: done -> not done', () => {
      vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      vi.mocked(dataAccess.useHabitEntries).mockReturnValue({ isLoading: false, data: [entry(true)] } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: done` }));
      expect(upsert).toHaveBeenCalledWith({ habitId: 'habit-1', logged_at: day, boolean_value: false });
    });

    it('cycles boolean cell: not done -> deleted', () => {
      vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockBooleanHabit } as any);
      vi.mocked(dataAccess.useHabitEntries).mockReturnValue({ isLoading: false, data: [entry(false)] } as any);
      render(withProviders(<HabitDetailPage />));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: not done` }));
      expect(del).toHaveBeenCalledWith({ habitId: 'habit-1', entryId: 'e1' });
    });

    it('opens the sheet for that date on numeric habit cell click', () => {
      vi.mocked(dataAccess.useHabit).mockReturnValue({ isLoading: false, data: mockNumericHabit } as any);
      vi.mocked(dataAccess.useHabitEntries).mockReturnValue({ isLoading: false, data: [] } as any);
      render(withProviders(<HabitDetailPage />, 'habit-2'));
      fireEvent.click(screen.getByRole('gridcell', { name: `${day}: unlogged` }));
      expect(screen.getByTestId('habit-sheet')).toHaveTextContent(day);
      expect(upsert).not.toHaveBeenCalled();
    });
  });
});
