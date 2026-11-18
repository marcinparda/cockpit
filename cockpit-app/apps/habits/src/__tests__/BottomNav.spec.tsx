import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { navItems } from '../components/navItems';

describe('BottomNav', () => {
  it('renders 4 tabs with correct labels and links', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Habits')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/habits');
    expect(hrefs).toContain('/stats');
    expect(hrefs).toContain('/settings');
  });

  it('renders from the shared navItems and highlights the active route', () => {
    render(
      <MemoryRouter initialEntries={['/habits']}>
        <BottomNav />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(navItems.length);
    expect(screen.getByRole('link', { name: 'Habits' })).toHaveClass(
      'text-primary',
    );
    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveClass(
      'text-primary',
    );
  });
});
