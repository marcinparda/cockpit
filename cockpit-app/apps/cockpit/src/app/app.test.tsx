import { fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, it, afterEach, expect } from 'vitest';
import App from './app';
import '@testing-library/jest-dom';
import * as useUserModule from '@cockpit-app/shared-react-data-access';
import { logoutAndRedirect } from '@cockpit-app/common-shared-data-access';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logout: vi.fn(),
  logoutAndRedirect: vi.fn(),
}));

vi.mock('./apps/apps', () => ({
  default: () => <div data-testid="apps-page">AppsPage</div>,
}));
vi.mock('./skeleton', () => ({
  AppSkeleton: () => <div data-testid="app-skeleton">Loading...</div>,
}));

describe('App', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders AppSkeleton while loading', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: true,
      data: undefined,
    } as any);
    render(<App />);
    expect(screen.getByTestId('app-skeleton')).toBeInTheDocument();
  });

  it('renders greeting with user email and apps page', () => {
    const userInfo = { email: 'test@example.com' };
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      data: userInfo,
    } as any);
    render(<App />);
    expect(screen.getByText('Hi test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByTestId('apps-page')).toBeInTheDocument();
  });

  it('logs out and redirects to Login on Logout click', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      data: { email: 'test@example.com' },
    } as any);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logoutAndRedirect).toHaveBeenCalledOnce();
  });
});
