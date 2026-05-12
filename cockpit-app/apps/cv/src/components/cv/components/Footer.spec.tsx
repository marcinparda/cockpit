import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the GDPR consent text', () => {
    render(<Footer />);
    expect(screen.getByText(/processing of personal data/i)).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).not.toBeNull();
  });
});
