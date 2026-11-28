import { render, screen } from '@testing-library/react';
import { PermissionGuard } from './PermissionGuard';
import { useHasPermission } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';

vi.mock('@cockpit-app/shared-react-data-access', () => ({
  useHasPermission: vi.fn(),
}));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logout: vi.fn(),
}));

describe('PermissionGuard', () => {
  it('renders children when user has permission', () => {
    vi.mocked(useHasPermission).mockReturnValue({
      hasPermission: true,
      isLoading: false,
    });

    render(
      <PermissionGuard feature="tasks" action="read">
        <span>Protected content</span>
      </PermissionGuard>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders fallback while loading', () => {
    vi.mocked(useHasPermission).mockReturnValue({
      hasPermission: false,
      isLoading: true,
    });

    render(
      <PermissionGuard feature="tasks" action="read" fallback={<span>Loading</span>}>
        <span>Protected content</span>
      </PermissionGuard>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('calls logout when user lacks permission', () => {
    vi.mocked(useHasPermission).mockReturnValue({
      hasPermission: false,
      isLoading: false,
    });

    const { container } = render(
      <PermissionGuard feature="tasks" action="write">
        <span>Protected content</span>
      </PermissionGuard>
    );

    expect(logout).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
