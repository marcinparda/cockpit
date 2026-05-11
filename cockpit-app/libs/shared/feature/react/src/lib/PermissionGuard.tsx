import { useHasPermission } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';

interface PermissionGuardProps {
  feature: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  feature,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useHasPermission(feature, action);

  if (isLoading) return <>{fallback}</>;

  if (!hasPermission) {
    logout();
    return null;
  }

  return <>{children}</>;
}
