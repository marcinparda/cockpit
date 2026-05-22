import { useUser } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';
import Router from './router';

export default function App() {
  const { isLoading, data: userInfo } = useUser();

  if (isLoading) {
    return null;
  }

  if (!userInfo) {
    logout();
    return null;
  }

  return <Router />;
}
