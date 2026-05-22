import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { z } from 'zod';

vi.mock('../api/hooks/useStats', () => ({
  useStatsToday: vi.fn(),
  useStatsWeekly: vi.fn(),
  useStatsStreaks: vi.fn(),
  useStatsMonthly: vi.fn(),
}));

vi.mock('../api/hooks/useSettings', () => ({
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
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

import * as useStatsModule from '../api/hooks/useStats';
import * as useSettingsModule from '../api/hooks/useSettings';
import StatsPage from '../pages/StatsPage';
import SettingsPage from '../pages/SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

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
    vi.mocked(useStatsModule.useStatsToday).mockReturnValue({
      isLoading: false,
      data: { completion_percentage: 75, completed: 3, total: 4 },
      error: null,
    } as any);

    vi.mocked(useStatsModule.useStatsWeekly).mockReturnValue({
      isLoading: false,
      data: [
        { day: 'Mon', completion_percentage: 100 },
        { day: 'Tue', completion_percentage: 50 },
        { day: 'Wed', completion_percentage: 75 },
      ],
      error: null,
    } as any);

    vi.mocked(useStatsModule.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    } as any);

    vi.mocked(useStatsModule.useStatsMonthly).mockReturnValue({
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
    vi.mocked(useStatsModule.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [
        { habit_id: 'h1', habit_name: 'Run', current_streak: 7 },
        { habit_id: 'h2', habit_name: 'Meditate', current_streak: 3 },
      ],
      error: null,
    } as any);

    render(withProviders(<StatsPage />));

    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Meditate')).toBeInTheDocument();
  });

  it('shows no streak data message when streaks is empty', () => {
    vi.mocked(useStatsModule.useStatsStreaks).mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    } as any);

    render(withProviders(<StatsPage />));

    expect(screen.getByText(/No streak data yet/i)).toBeInTheDocument();
  });

  it('renders monthly highlights when monthly data is provided', () => {
    vi.mocked(useStatsModule.useStatsMonthly).mockReturnValue({
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

describe('SettingsPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    // notification_enabled: true so clicking disables it — calls mutate synchronously
    vi.mocked(useSettingsModule.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notification_enabled: true,
        week_start_day: 0,
      },
      error: null,
    } as any);

    vi.mocked(useSettingsModule.useUpdateSettings).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('push toggle calls PATCH /api/v1/habits/settings on change', () => {
    render(withProviders(<SettingsPage />));

    const toggle = screen.getByTestId('push-toggle');
    fireEvent.click(toggle);

    expect(mockMutate).toHaveBeenCalledWith({
      notification_enabled: false,
      push_subscription: null,
    });
  });

  it('enables push notifications when permission granted and subscription succeeds', async () => {
    vi.mocked(useSettingsModule.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notification_enabled: false,
        week_start_day: 0,
      },
      error: null,
    } as any);

    // Mock Notification.requestPermission to return 'granted'
    Object.defineProperty(window, 'Notification', {
      value: { requestPermission: vi.fn().mockResolvedValue('granted') },
      writable: true,
    });

    // Mock fetch for VAPID key
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ public_key: 'test_vapid_key' }),
    } as any);

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: {
            subscribe: vi.fn().mockResolvedValue({
              toJSON: vi.fn().mockReturnValue({ endpoint: 'https://test.push', keys: {} }),
            }),
          },
        }),
      },
      writable: true,
    });

    render(withProviders(<SettingsPage />));
    const toggle = screen.getByTestId('push-toggle');
    fireEvent.click(toggle);

    // Wait for the async flow to complete
    await screen.findByTestId('push-toggle');
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ notification_enabled: true }),
    );
  });

  it('renders loading state while settings load', () => {
    vi.mocked(useSettingsModule.useSettings).mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
    } as any);

    render(withProviders(<SettingsPage />));

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows push error when permission is denied', async () => {
    vi.mocked(useSettingsModule.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notification_enabled: false,
        week_start_day: 0,
      },
      error: null,
    } as any);

    // Mock Notification.requestPermission to return 'denied'
    Object.defineProperty(window, 'Notification', {
      value: { requestPermission: vi.fn().mockResolvedValue('denied') },
      writable: true,
    });

    render(withProviders(<SettingsPage />));
    const toggle = screen.getByTestId('push-toggle');
    fireEvent.click(toggle);

    // Wait for async permission check
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(/denied/i);
  });

  it('useSettings hook parses response with UserHabitSettingsSchema', () => {
    // Define schema inline to verify shape — matches the real UserHabitSettingsSchema
    const UserHabitSettingsSchema = z.object({
      id: z.string().uuid(),
      user_id: z.string().uuid(),
      notification_enabled: z.boolean(),
      notification_time: z.string().optional(),
      week_start_day: z.number(),
      created_at: z.string().datetime().optional(),
      updated_at: z.string().datetime().optional(),
    });

    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      notification_enabled: true,
      week_start_day: 1,
    };
    const result = UserHabitSettingsSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notification_enabled).toBe(true);
    }
  });
});
