import { Outlet } from 'react-router-dom';
import { AppShell } from '@cockpit-app/shared-react-ui';
import { UserMenu } from '@cockpit-app/shared-react-feature';
import { navItems } from './navItems';

interface AppLayoutProps {
  user: { email: string };
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
