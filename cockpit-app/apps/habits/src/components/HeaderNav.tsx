import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

export default function HeaderNav() {
  return (
    <header className="hidden border-b border-border bg-background md:block">
      <nav className="mx-auto flex w-full max-w-[1920px] items-center gap-2 px-4 py-2">
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
    </header>
  );
}
