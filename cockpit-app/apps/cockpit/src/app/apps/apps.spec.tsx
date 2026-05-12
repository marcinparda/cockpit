import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AppsPage from './apps';

vi.mock('@cockpit-app/shared-react-ui', () => ({
  TypographyH1: ({ children }: any) => <h1>{children}</h1>,
  TypographyP: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@cockpit-app/cockpit-ui', () => ({
  AppCard: ({ title }: any) => <div data-testid="app-card">{title}</div>,
}));

vi.mock('@cockpit-app/shared-utils', () => ({
  environments: {
    brainUrl: 'http://brain.test',
    agentUrl: 'http://agent.test',
    twodoUrl: 'http://twodo.test',
    actualUrl: 'http://actual.test',
    cvUrl: 'http://cv.test',
    storeUrl: 'http://store.test',
    storybookUrl: 'http://storybook.test',
  },
}));

const mockUsePermissions = vi.fn();
const mockUseIsAdmin = vi.fn();

vi.mock('@cockpit-app/shared-react-data-access', () => ({
  usePermissions: () => mockUsePermissions(),
  useIsAdmin: () => mockUseIsAdmin(),
}));

describe('AppsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing (loading state) while permissions are loading', () => {
    mockUsePermissions.mockReturnValue({ data: [], isLoading: true });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(<AppsPage />);

    expect(screen.queryByTestId('app-card')).not.toBeInTheDocument();
  });

  it('renders nothing (loading state) while roles are loading', () => {
    mockUsePermissions.mockReturnValue({ data: [], isLoading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: true });

    render(<AppsPage />);

    expect(screen.queryByTestId('app-card')).not.toBeInTheDocument();
  });

  it('renders only apps with matching permissions for non-admin user', () => {
    mockUsePermissions.mockReturnValue({
      data: [
        { feature: { name: 'vikunja' }, action: { name: 'read' } },
      ],
      isLoading: false,
    });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(<AppsPage />);

    const cards = screen.getAllByTestId('app-card');
    const titles = cards.map((c) => c.textContent);
    expect(titles).toContain('Twodo');
    expect(titles).not.toContain('Agent');
    expect(titles).not.toContain('Storybook');
    expect(titles).not.toContain('CV');
  });

  it('renders admin-only apps when user is admin', () => {
    mockUsePermissions.mockReturnValue({ data: [], isLoading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true, isLoading: false });

    render(<AppsPage />);

    const cards = screen.getAllByTestId('app-card');
    const titles = cards.map((c) => c.textContent);
    expect(titles).toContain('Agent');
    expect(titles).toContain('CV');
    expect(titles).toContain('Storybook');
  });

  it('renders no permission-restricted apps when user has no permissions', () => {
    mockUsePermissions.mockReturnValue({ data: [], isLoading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(<AppsPage />);

    expect(screen.queryByTestId('app-card')).not.toBeInTheDocument();
  });
});
