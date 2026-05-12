import { render, screen } from '@testing-library/react';
import { TopNavBar } from './TopNavBar';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Docs', href: 'https://docs.example.com', external: true },
];

describe('TopNavBar', () => {
  it('renders nav links', () => {
    render(<TopNavBar navLinks={navLinks} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('external links have target="_blank"', () => {
    render(<TopNavBar navLinks={navLinks} />);
    const externalLink = screen.getByText('Docs').closest('a');
    expect(externalLink).toHaveAttribute('target', '_blank');
  });

  it('internal links do not have target="_blank"', () => {
    render(<TopNavBar navLinks={navLinks} />);
    const internalLink = screen.getByText('Home').closest('a');
    expect(internalLink).not.toHaveAttribute('target', '_blank');
  });

  it('renders brandName when provided', () => {
    render(<TopNavBar navLinks={[]} brandName="MyCockpit" />);
    expect(screen.getByText('MyCockpit')).toBeInTheDocument();
  });

  it('renders rightContent when provided', () => {
    render(
      <TopNavBar navLinks={[]} rightContent={<button>Logout</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
