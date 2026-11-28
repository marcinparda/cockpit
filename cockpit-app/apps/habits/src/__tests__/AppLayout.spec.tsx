import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@cockpit-app/common-shared-data-access', () => ({ logout: vi.fn() }));

import AppLayout from '../components/AppLayout';
import { navItems } from '../components/navItems';

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout user={{ email: 'me@example.com' }} />}>
          <Route path="*" element={<p>Page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('renders Habits inside the shared shell with user email and page', () => {
    renderLayout();
    expect(
      screen.getByText('Habits', { selector: 'span.text-sm' }),
    ).toBeInTheDocument();
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('shows every nav item in header and bottom nav', () => {
    renderLayout();
    for (const nav of screen.getAllByRole('navigation')) {
      const hrefs = within(nav)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'));
      expect(hrefs).toEqual(navItems.map((i) => i.to));
    }
  });
});
