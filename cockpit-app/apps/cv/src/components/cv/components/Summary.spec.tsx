import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Summary } from './Summary';

describe('Summary', () => {
  it('renders the section title', () => {
    render(<Summary summary={['A great developer.']} />);
    expect(screen.getByText('SUMMARY')).toBeInTheDocument();
  });

  it('renders each summary paragraph', () => {
    render(<Summary summary={['Paragraph one.', 'Paragraph two.']} />);
    expect(screen.getByText('Paragraph one.')).toBeInTheDocument();
    expect(screen.getByText('Paragraph two.')).toBeInTheDocument();
  });

  it('renders URLs as anchor links', () => {
    render(<Summary summary={['Visit https://example.com for more.']} />);
    expect(screen.getByRole('link', { name: 'https://example.com' })).toBeInTheDocument();
  });

  it('renders nothing when summary is empty', () => {
    render(<Summary summary={[]} />);
    expect(screen.queryByText(/paragraph/i)).not.toBeInTheDocument();
  });
});
