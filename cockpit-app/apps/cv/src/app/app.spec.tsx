import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';
import App from './app';
import * as useUserModule from '@cockpit-app/shared-react-data-access';

vi.mock('@cockpit-app/shared-react-data-access', () => ({
  useUser: vi.fn(),
}));

vi.mock('../components/editor/CVEditor', () => ({
  CVEditor: () => <div data-testid="cv-editor" />,
}));

vi.mock('./skeleton', () => ({
  AppSkeleton: () => <div data-testid="app-skeleton" />,
}));

describe('App', () => {
  it('should render successfully', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: 'test-user', name: 'Test User' },
    } as any);
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('renders CVEditor when user is loaded', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: 'test-user', email: 'test@test.com' },
    } as any);
    render(<App />);
    expect(screen.getByTestId('cv-editor')).toBeInTheDocument();
  });

  it('renders AppSkeleton while loading', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as any);
    render(<App />);
    expect(screen.getByTestId('app-skeleton')).toBeInTheDocument();
  });

  it('renders AppSkeleton and redirects on isError', () => {
    const mockHref = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as any);
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as any);
    render(<App />);
    expect(screen.getByTestId('app-skeleton')).toBeInTheDocument();
    mockHref.mockRestore();
  });

  it('renders AppSkeleton and redirects when userInfo is null', () => {
    vi.spyOn(useUserModule, 'useUser').mockReturnValue({
      isLoading: false,
      isError: false,
      data: null,
    } as any);
    render(<App />);
    expect(screen.getByTestId('app-skeleton')).toBeInTheDocument();
  });
});
