import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import * as dataAccess from '@cockpit-app/habits-data-access';
import { StatsPage } from './StatsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useStatsToday: vi.fn(),
  useStatsWeekly: vi.fn(),
  useStatsStreaks: vi.fn(),
  useStatsMonthly: vi.fn(),
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withProviders(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(dataAccess.useStatsToday).mockReturnValue({
      isLoading: false,
      data: { completion_pct: 75, completed: 3, total: 4 },
      error: null,
    } as any);

    vi.mocked(dataAccess.useStatsWeekly).mockReturnValue({
      isLoading: false,
      data: [
        { day: 'Mon', completion_percentage: 100 },
        { day: 'Tue', completion_percentage: 50 },
        { day: 'Wed', completion_percentage: 75 },
      ],
      error: null,
    } as any);

    vi.mocked(dataAccess.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    } as any);

    vi.mocked(dataAccess.useStatsMonthly).mockReturnValue({
      isLoading: false,
      data: null,
      error: null,
    } as any);
  });

  it('renders today completion percentage from API data', () => {
    render(withProviders(<StatsPage />));

    expect(screen.getByTestId('today-completion')).toHaveTextContent('75%');
  });

  it('renders weekly bar chart component', () => {
    render(withProviders(<StatsPage />));

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders streak list when streaks data available', () => {
    vi.mocked(dataAccess.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [
        { id: 'h1', name: 'Run', current_streak: 7 },
        { id: 'h2', name: 'Meditate', current_streak: 3 },
      ],
      error: null,
    } as any);

    render(withProviders(<StatsPage />));

    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Meditate')).toBeInTheDocument();
  });

  it('shows no streak data message when streaks is empty', () => {
    vi.mocked(dataAccess.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    } as any);

    render(withProviders(<StatsPage />));

    expect(screen.getByText(/No streak data yet/i)).toBeInTheDocument();
  });

  it('renders monthly highlights when monthly data is provided', () => {
    vi.mocked(dataAccess.useStatsMonthly).mockReturnValue({
      isLoading: false,
      data: {
        longest_streak_habit: 'Morning Run',
        longest_streak: 14,
        most_consistent_habit: 'Meditation',
        consistency_rate: 85,
      },
      error: null,
    } as any);

    render(withProviders(<StatsPage />));

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Meditation')).toBeInTheDocument();
  });
});
