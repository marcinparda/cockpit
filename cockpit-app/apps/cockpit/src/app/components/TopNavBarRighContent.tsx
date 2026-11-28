import { Button, TypographySmall } from '@cockpit-app/shared-react-ui';
import { logoutAndRedirect } from '@cockpit-app/common-shared-data-access';
import { UserInfoResponse } from '@cockpit-app/api-types';

interface TopNavBarRighContentProps {
  userInfo: UserInfoResponse;
}

export function TopNavBarRighContent({ userInfo }: TopNavBarRighContentProps) {
  return (
    <div className="flex items-center gap-4">
      <TypographySmall>Logged in as: {userInfo.email}</TypographySmall>
      <Button variant="ghost" onClick={() => logoutAndRedirect()}>
        Logout
      </Button>
    </div>
  );
}
