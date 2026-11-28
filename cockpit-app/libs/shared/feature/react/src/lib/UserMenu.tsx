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
      <Button variant="ghost" onClick={() => logoutAndRedirect()}>
        Logout
      </Button>
    </div>
  );
}
