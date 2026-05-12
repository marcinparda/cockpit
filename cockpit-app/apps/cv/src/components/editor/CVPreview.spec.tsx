import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CVPreview } from './CVPreview';
import type { CVData } from '../../types/cv.types';

vi.mock('react-to-print', () => ({
  useReactToPrint: () => vi.fn(),
}));

const mockCVData: CVData = {
  header: {
    name: 'Preview User',
    title: 'Engineer',
    phone: '+48 000',
    email: 'user@example.com',
    linkedin: { url: 'linkedin.com/in/user' },
    location: 'Warsaw',
  },
  summary: ['Short summary.'],
  skills: [{ name: 'TypeScript', years: 3, description: '' }],
  achievements: [],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('CVPreview', () => {
  it('renders the Preview heading', () => {
    render(<CVPreview cvData={mockCVData} presetId='base' />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders CV content with user name', () => {
    render(<CVPreview cvData={mockCVData} presetId='base' />);
    expect(screen.getByText('Preview User')).toBeInTheDocument();
  });

  it('renders Export PDF button', () => {
    render(<CVPreview cvData={mockCVData} presetId='base' />);
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
  });
});
