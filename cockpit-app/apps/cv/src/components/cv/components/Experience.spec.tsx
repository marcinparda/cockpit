import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Experience } from './Experience';
import type { ExperienceItem } from './Experience';

const item: ExperienceItem = {
  title: 'Frontend Developer',
  company: 'Acme Corp',
  date: '2020-2023',
  location: 'Remote',
  description: ['Built React apps', 'Improved performance'],
};

describe('Experience', () => {
  it('renders the section title', () => {
    render(<Experience experience={[item]} />);
    expect(screen.getByText('EXPERIENCE')).toBeInTheDocument();
  });

  it('renders title, company, and description points', () => {
    render(<Experience experience={[item]} />);
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Built React apps')).toBeInTheDocument();
  });

  it('renders optional details when provided', () => {
    render(<Experience experience={[{ ...item, details: 'Tech lead role' }]} />);
    expect(screen.getByText('Tech lead role')).toBeInTheDocument();
  });

  it('does not render details element when omitted', () => {
    render(<Experience experience={[item]} />);
    expect(screen.queryByText('Tech lead role')).not.toBeInTheDocument();
  });
});
