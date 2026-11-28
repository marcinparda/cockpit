import { useEffect, type ReactNode } from 'react';
import type { UserInfoResponse } from '@cockpit-app/api-types';
import { useUser } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';

interface RequireUserProps {
  children: (user: UserInfoResponse) => ReactNode;
}

/** Loads the user; redirects to Login when there is no session. */
export function RequireUser({ children }: RequireUserProps) {
  const { isLoading, data: user } = useUser();

  const missing = !isLoading && !user;

  useEffect(() => {
    if (missing) logout();
  }, [missing]);

  if (isLoading || !user) return null;

  return <>{children(user)}</>;
}
