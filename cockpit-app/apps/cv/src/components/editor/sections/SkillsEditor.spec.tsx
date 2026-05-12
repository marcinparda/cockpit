import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillsEditor } from './SkillsEditor';
import type { CVData } from '../../../types/cv.types';

const baseCVData: CVData = {
  header: {
    name: '',
    title: '',
    phone: '',
    email: '',
    linkedin: { url: '' },
    location: '',
  },
  summary: [],
  skills: [
    { name: 'TypeScript', years: 4, description: '' },
    { name: 'React', years: 3, description: '' },
  ],
  achievements: [],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('SkillsEditor', () => {
  it('renders an input for each skill', () => {
    render(<SkillsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('TypeScript')).toBeInTheDocument();
    expect(screen.getByDisplayValue('React')).toBeInTheDocument();
  });

  it('calls setCVData when a skill input changes', () => {
    const setCVData = vi.fn();
    render(<SkillsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('TypeScript'), {
      target: { value: 'JavaScript' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Skill button', () => {
    render(<SkillsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add skill/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Skill is clicked', () => {
    const setCVData = vi.fn();
    render(<SkillsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove skill button is clicked', () => {
    const setCVData = vi.fn();
    render(<SkillsEditor cvData={baseCVData} setCVData={setCVData} />);
    const allBtns = screen.getAllByRole('button');
    fireEvent.click(allBtns[allBtns.length - 2]);
    expect(setCVData).toHaveBeenCalled();
  });
});
