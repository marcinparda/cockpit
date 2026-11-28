import { LogOut } from 'lucide-react';
import type { UserInfoResponse } from '@cockpit-app/api-types';
import { logoutAndRedirect } from '@cockpit-app/common-shared-data-access';
import { Button, TypographySmall } from '@cockpit-app/shared-react-ui';

interface UserMenuProps {
  user: Pick<UserInfoResponse, 'email'>;
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden sm:inline">
        <TypographySmall>{user.email}</TypographySmall>
      </span>
      <Button variant="ghost" size="sm" onClick={() => logoutAndRedirect()}>
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
        Logout
      </Button>
    </div>
  );
}
