import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { logout } from '@cockpit-app/common-shared-data-access';
import { UserMenu } from './UserMenu';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logout: vi.fn(),
}));

describe('UserMenu', () => {
  it('shows the user email', () => {
    render(<UserMenu user={{ email: 'me@example.com' }} />);
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
  });

  it('logs out on Logout click', () => {
    render(<UserMenu user={{ email: 'me@example.com' }} />);
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(logout).toHaveBeenCalled();
  });
});
