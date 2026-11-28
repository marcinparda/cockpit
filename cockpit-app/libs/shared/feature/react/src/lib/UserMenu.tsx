import type { UserInfoResponse } from '@cockpit-app/api-types';
import { LogOut } from 'lucide-react';
import { logout } from '@cockpit-app/common-shared-data-access';
import { Button } from '@cockpit-app/shared-react-ui';

interface UserMenuProps {
  user: Pick<UserInfoResponse, 'email'>;
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden text-sm sm:inline">
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Logout"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
