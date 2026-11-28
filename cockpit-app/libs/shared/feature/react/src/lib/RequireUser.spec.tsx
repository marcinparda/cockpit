import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { useUser } from '@cockpit-app/shared-react-data-access';
import { logoutAndRedirect } from '@cockpit-app/common-shared-data-access';
import { RequireUser } from './RequireUser';

vi.mock('@cockpit-app/shared-react-data-access', () => ({ useUser: vi.fn() }));
vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logoutAndRedirect: vi.fn(),
}));

describe('RequireUser', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders nothing while loading', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoading: true,
      data: undefined,
    } as never);
    const { container } = render(<RequireUser>{() => <p>in</p>}</RequireUser>);
    expect(container).toBeEmptyDOMElement();
    expect(logoutAndRedirect).not.toHaveBeenCalled();
  });

  it('redirects to Login (logout) and renders nothing without a session', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoading: false,
      data: undefined,
    } as never);
    const { container } = render(<RequireUser>{() => <p>in</p>}</RequireUser>);
    expect(logoutAndRedirect).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it('passes the user to children', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoading: false,
      data: { email: 'me@example.com' },
    } as never);
    render(<RequireUser>{(user) => <p>hi {user.email}</p>}</RequireUser>);
    expect(screen.getByText('hi me@example.com')).toBeInTheDocument();
  });
});
