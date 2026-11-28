import AppsPage from './apps/apps';
import { useUser } from '@cockpit-app/shared-react-data-access';
import { AppSkeleton } from './skeleton';
import {
  logout,
  logoutAndRedirect,
} from '@cockpit-app/common-shared-data-access';
import { Button, ThemeToggle } from '@cockpit-app/shared-react-ui';
import { LogOut } from 'lucide-react';

export default function App() {
  const { isLoading, data: userInfo } = useUser();
  if (isLoading) {
    return <AppSkeleton />;
  }

  if (!userInfo) {
    logout();
    return <AppSkeleton />;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="fixed top-4 right-6 z-10 flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={() => logoutAndRedirect()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Hi {userInfo.email}
          </h1>
          <p className="text-muted-foreground">
            Here are the list of all cockpit apps that you have access to:
          </p>
        </div>
        <AppsPage />
      </div>
    </div>
  );
}
