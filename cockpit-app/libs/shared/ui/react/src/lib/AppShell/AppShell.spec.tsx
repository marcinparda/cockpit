import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { environments } from '@cockpit-app/shared-utils';
import { AppShell, type AppShellNavItem } from './AppShell';

const navItems: AppShellNavItem[] = [
  { to: '/', label: 'Today', icon: <svg data-testid="icon-today" /> },
  { to: '/habits', label: 'Habits', icon: <svg /> },
];

function renderShell(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell
        appName="Demo"
        navItems={navItems}
        userArea={<span>me@example.com</span>}
        actions={<button>Do thing</button>}
      >
        <p>Page content</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders brand, app name, slots and children', () => {
    renderShell();
    expect(screen.getByText('Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
    expect(screen.getByText('Do thing')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('logo links to the Dashboard', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /cockpit/i })).toHaveAttribute(
      'href',
      environments.cockpitUrl,
    );
  });

  it('renders nav items in the header and the bottom nav', () => {
    renderShell();
    const navs = screen.getAllByRole('navigation');
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      const hrefs = within(nav)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'));
      expect(hrefs).toEqual(['/', '/habits']);
    }
  });

  it('highlights the active route in both navs', () => {
    renderShell('/habits');
    for (const link of screen.getAllByRole('link', { name: 'Habits' })) {
      expect(link).toHaveClass('text-primary');
    }
    for (const link of screen.getAllByRole('link', { name: 'Today' })) {
      expect(link).not.toHaveClass('text-primary');
    }
  });

  it('includes the theme toggle', () => {
    renderShell();
    expect(
      screen.getByRole('button', { name: 'Toggle dark mode' }),
    ).toBeInTheDocument();
  });
});
