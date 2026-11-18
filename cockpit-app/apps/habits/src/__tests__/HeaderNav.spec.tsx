import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import HeaderNav from '../components/HeaderNav';
import { navItems } from '../components/navItems';

describe('HeaderNav', () => {
  it('renders every shared nav item as a link', () => {
    render(
      <MemoryRouter>
        <HeaderNav />
      </MemoryRouter>,
    );
    const hrefs = screen
      .getAllByRole('link')
      .map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(navItems.map((i) => i.to));
  });

  it('highlights the active route', () => {
    render(
      <MemoryRouter initialEntries={['/stats']}>
        <HeaderNav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveClass(
      'text-primary',
    );
    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveClass(
      'text-primary',
    );
  });
});
