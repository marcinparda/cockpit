import type { UserInfoResponse } from '@cockpit-app/api-types';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  HabitDetailPage,
  HabitsPage,
  SettingsPage,
  StatsPage,
  TodayPage,
} from '@cockpit-app/habits-feature';
import AppLayout from './AppLayout';

interface RouterProps {
  user: Pick<UserInfoResponse, 'email'>;
}

export default function Router({ user }: RouterProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout user={user} />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
