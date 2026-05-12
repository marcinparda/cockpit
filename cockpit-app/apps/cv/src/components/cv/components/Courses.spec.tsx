import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Courses } from './Courses';

describe('Courses', () => {
  it('renders each course item', () => {
    render(<Courses courses={['TypeScript', 'React Advanced']} />);
    expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
    expect(screen.getByText(/React Advanced/)).toBeInTheDocument();
  });

  it('renders the section title', () => {
    render(<Courses courses={['TypeScript']} />);
    expect(screen.getByText('COURSES')).toBeInTheDocument();
  });

  it('renders nothing in the list when courses is empty', () => {
    render(<Courses courses={[]} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
