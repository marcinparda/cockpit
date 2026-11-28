import { RequireUser } from '@cockpit-app/shared-react-feature';
import Router from './router';

export default function App() {
  return <RequireUser>{(user) => <Router user={user} />}</RequireUser>;
}
