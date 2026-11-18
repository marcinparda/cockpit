import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import HeaderNav from './HeaderNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <HeaderNav />
      <div className="mx-auto w-full max-w-[1920px]">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
