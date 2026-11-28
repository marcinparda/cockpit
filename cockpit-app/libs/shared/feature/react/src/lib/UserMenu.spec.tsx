import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { logoutAndRedirect } from '@cockpit-app/common-shared-data-access';
import { UserMenu } from './UserMenu';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logoutAndRedirect: vi.fn(),
}));

describe('UserMenu', () => {
  it('shows the user email', () => {
    render(<UserMenu user={{ email: 'me@example.com' }} />);
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
  });

  it('shows a Logout text button', () => {
    render(<UserMenu user={{ email: 'me@example.com' }} />);
    expect(screen.getByRole('button')).toHaveTextContent('Logout');
  });

  it('logs out and redirects to Login on Logout click', () => {
    render(<UserMenu user={{ email: 'me@example.com' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logoutAndRedirect).toHaveBeenCalledOnce();
  });
});
