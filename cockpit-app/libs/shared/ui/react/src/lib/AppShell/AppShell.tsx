import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { environments } from '@cockpit-app/shared-utils';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export interface AppShellNavItem {
  /** Router target of the item. */
  to: string;
  label: string;
  icon: ReactNode;
}

export interface AppShellProps {
  appName: string;
  navItems: AppShellNavItem[];
  /** Right side of the header, e.g. the user menu. */
  userArea?: ReactNode;
  /** Right side of the header, App-specific actions. */
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  appName,
  navItems,
  userArea,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <header className="border-border bg-background border-b">
        <div className="mx-auto flex w-full max-w-[1920px] items-center gap-2 px-4 py-2">
          <a
            href={environments.cockpitUrl}
            className="flex items-center gap-2 font-semibold"
          >
            <Gauge className="text-primary h-5 w-5" aria-hidden />
            <span>Cockpit</span>
          </a>
          <span className="text-muted-foreground text-sm">{appName}</span>
          <nav
            aria-label={`${appName} navigation`}
            className="ml-4 hidden items-center gap-2 md:flex"
          >
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {icon}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            {userArea}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1920px]">{children}</div>
      <nav
        aria-label={`${appName} bottom navigation`}
        className="border-border bg-background fixed right-0 bottom-0 left-0 z-50 flex w-full border-t md:hidden"
      >
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
