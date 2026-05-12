import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { TopNavBarRighContent } from './TopNavBarRighContent';

const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logout: mockLogout,
}));

vi.mock('@cockpit-app/shared-utils', () => ({
  environments: { loginUrl: 'http://login.test' },
}));

vi.mock('@cockpit-app/shared-react-ui', () => ({
  TypographySmall: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

const mockUserInfo = {
  id: 'user-1',
  email: 'test@example.com',
};

describe('TopNavBarRighContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('displays the user email', () => {
    render(<TopNavBarRighContent userInfo={mockUserInfo as any} />);
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });

  it('renders Logout button', () => {
    render(<TopNavBarRighContent userInfo={mockUserInfo as any} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls logout when Logout button is clicked', async () => {
    const user = userEvent.setup();
    render(<TopNavBarRighContent userInfo={mockUserInfo as any} />);

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
