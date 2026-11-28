import type { UserInfoResponse } from '@cockpit-app/api-types';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@cockpit-app/shared-react-ui';
import { UserMenu } from '@cockpit-app/shared-react-feature';
import { navItems } from './navItems';

interface AppLayoutProps {
  user: Pick<UserInfoResponse, 'email'>;
}

export default function AppLayout({ user }: AppLayoutProps) {
  return (
    <AppShell
      appName="Habits"
      navItems={navItems}
      userArea={<UserMenu user={user} />}
    >
      <Outlet />
    </AppShell>
  );
}
