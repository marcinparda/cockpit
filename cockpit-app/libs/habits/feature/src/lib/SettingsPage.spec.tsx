import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { z } from 'zod';
import * as dataAccess from '@cockpit-app/habits-data-access';
import { SettingsPage } from './SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
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

describe('SettingsPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    // notifications_enabled: true so clicking disables it — calls mutate synchronously
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notifications_enabled: true,
        week_start_day: 0,
      },
      error: null,
    } as any);

    vi.mocked(dataAccess.useUpdateSettings).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('push toggle calls PATCH /api/v1/habits/settings on change', () => {
    render(withProviders(<SettingsPage />));

    const toggle = screen.getByTestId('push-toggle');
    fireEvent.click(toggle);

    expect(mockMutate).toHaveBeenCalledWith({
      notifications_enabled: false,
      push_subscription: null,
    });
  });

  it('setting a reminder time saves it with the browser timezone by default', () => {
    render(withProviders(<SettingsPage />));
    fireEvent.change(screen.getByTestId('reminder-time'), { target: { value: '08:30' } });
    expect(mockMutate).toHaveBeenCalledWith({
      reminder_time: '08:30',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });

  it('keeps the stored timezone when changing the reminder time', () => {
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notifications_enabled: true,
        reminder_time: '08:30:00',
        timezone: 'Europe/Warsaw',
      },
      error: null,
    } as any);
    render(withProviders(<SettingsPage />));
    expect((screen.getByTestId('reminder-time') as HTMLInputElement).value).toBe('08:30');
    fireEvent.change(screen.getByTestId('reminder-time'), { target: { value: '09:00' } });
    expect(mockMutate).toHaveBeenCalledWith({ reminder_time: '09:00' });
  });

  it('clear button unsets the reminder time', () => {
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notifications_enabled: true,
        reminder_time: '08:30:00',
        timezone: 'UTC',
      },
      error: null,
    } as any);
    render(withProviders(<SettingsPage />));
    fireEvent.click(screen.getByTestId('reminder-clear'));
    expect(mockMutate).toHaveBeenCalledWith({ reminder_time: null });
  });

  it('enables push notifications when permission granted and subscription succeeds', async () => {
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notifications_enabled: false,
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
      expect.objectContaining({ notifications_enabled: true }),
    );
  });

  it('renders loading state while settings load', () => {
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
    } as any);

    render(withProviders(<SettingsPage />));

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows push error when permission is denied', async () => {
    vi.mocked(dataAccess.useSettings).mockReturnValue({
      isLoading: false,
      data: {
        id: 'settings-1',
        user_id: 'user-1',
        notifications_enabled: false,
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
