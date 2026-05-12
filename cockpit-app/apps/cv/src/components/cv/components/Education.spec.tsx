import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Education } from './Education';

const item = { degree: 'B.Sc. Computer Science', university: 'AGH', years: '2018-2022' };

describe('Education', () => {
  it('renders the section title', () => {
    render(<Education education={[item]} />);
    expect(screen.getByText('EDUCATION')).toBeInTheDocument();
  });

  it('renders degree, university, and years', () => {
    render(<Education education={[item]} />);
    expect(screen.getByText('B.Sc. Computer Science')).toBeInTheDocument();
    expect(screen.getByText('AGH')).toBeInTheDocument();
    expect(screen.getByText('2018-2022')).toBeInTheDocument();
  });

  it('renders nothing when education array is empty', () => {
    render(<Education education={[]} />);
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });
});
