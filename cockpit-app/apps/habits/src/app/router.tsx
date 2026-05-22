import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayPage from '../pages/TodayPage';
import HabitsPage from '../pages/HabitsPage';
import StatsPage from '../pages/StatsPage';
import SettingsPage from '../pages/SettingsPage';
import HabitDetailPage from '../pages/HabitDetailPage';
import BottomNav from '../components/BottomNav';

export default function Router() {
  return (
    <BrowserRouter>
      <div className="min-h-screen pb-16">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
