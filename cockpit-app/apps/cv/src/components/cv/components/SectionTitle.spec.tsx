import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionTitle } from './SectionTitle';

describe('SectionTitle', () => {
  it('renders children text', () => {
    render(<SectionTitle>EXPERIENCE</SectionTitle>);
    expect(screen.getByText('EXPERIENCE')).toBeInTheDocument();
  });

  it('renders as an h3 element', () => {
    render(<SectionTitle>SKILLS</SectionTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
