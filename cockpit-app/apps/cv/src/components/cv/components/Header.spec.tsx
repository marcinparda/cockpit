import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';
import type { HeaderData } from './Header';

const headerData: HeaderData = {
  name: 'John Doe',
  title: 'Software Engineer',
  phone: '+48 123 456 789',
  email: 'john@example.com',
  linkedin: { url: 'linkedin.com/in/johndoe', text: 'johndoe' },
  location: 'Warsaw, Poland',
};

describe('Header', () => {
  it('renders name and title', () => {
    render(<Header headerData={headerData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<Header headerData={headerData} />);
    expect(screen.getByText('+48 123 456 789')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Warsaw, Poland')).toBeInTheDocument();
  });

  it('renders linkedin link with display text', () => {
    render(<Header headerData={headerData} />);
    const link = screen.getByRole('link', { name: 'johndoe' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/johndoe');
  });

  it('falls back to url when linkedin text is omitted', () => {
    render(<Header headerData={{ ...headerData, linkedin: { url: 'linkedin.com/in/johndoe' } }} />);
    expect(screen.getByText('linkedin.com/in/johndoe')).toBeInTheDocument();
  });
});
