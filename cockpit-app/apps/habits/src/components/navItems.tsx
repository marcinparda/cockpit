import { Home, List, BarChart, Settings } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Today', icon: <Home className="h-5 w-5" /> },
  { to: '/habits', label: 'Habits', icon: <List className="h-5 w-5" /> },
  { to: '/stats', label: 'Stats', icon: <BarChart className="h-5 w-5" /> },
  {
    to: '/settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
];
