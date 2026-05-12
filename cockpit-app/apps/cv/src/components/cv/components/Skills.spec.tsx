import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skills } from './Skills';
import type { Skill } from '../../../types/cv.types';

const skills: Skill[] = [
  { name: 'TypeScript', years: 4, description: '' },
  { name: 'React', years: 3, description: '' },
];

describe('Skills', () => {
  it('renders the section title', () => {
    render(<Skills skills={skills} />);
    expect(screen.getByText('SKILLS')).toBeInTheDocument();
  });

  it('renders each skill name as a badge', () => {
    render(<Skills skills={skills} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders no badges when skills array is empty', () => {
    render(<Skills skills={[]} />);
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });
});
