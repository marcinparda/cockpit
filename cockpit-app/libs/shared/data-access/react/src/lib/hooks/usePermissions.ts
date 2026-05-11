import { useQuery } from '@tanstack/react-query';
import {
  getCurrentUserPermissions,
  getCurrentUserRoles,
} from '@cockpit-app/common-shared-data-access';
import { queryKeys } from '../queryKeys';
import type { Permission } from '@cockpit-app/api-types';

export function usePermissions() {
  return useQuery<Permission[]>({
    queryFn: getCurrentUserPermissions,
    queryKey: [queryKeys.userPermissions],
  });
}

export function useHasPermission(feature: string, action: string) {
  const { data: permissions = [], isLoading, isError } = usePermissions();
  const hasPermission = permissions.some(
    (p) => p.feature?.name === feature && p.action?.name === action,
  );
  return { hasPermission, isLoading, isError };
}

export function useIsAdmin() {
  const { data: roles = [], isLoading, isError } = useQuery({
    queryFn: getCurrentUserRoles,
    queryKey: [queryKeys.userRoles],
  });
  const isAdmin = roles.some((r) => r.name === 'Admin');
  return { isAdmin, isLoading, isError };
}
