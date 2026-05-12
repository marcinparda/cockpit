import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EducationEditor } from './EducationEditor';
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
  skills: [],
  achievements: [],
  experience: [],
  education: [{ degree: 'B.Sc. CS', university: 'AGH', years: '2018-2022' }],
  personalProjects: [],
  courses: [],
};

describe('EducationEditor', () => {
  it('renders Degree, University, and Years inputs', () => {
    render(<EducationEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('B.Sc. CS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AGH')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2018-2022')).toBeInTheDocument();
  });

  it('calls setCVData when degree changes', () => {
    const setCVData = vi.fn();
    render(<EducationEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('B.Sc. CS'), {
      target: { value: 'M.Sc. CS' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Education button', () => {
    render(<EducationEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add education/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Education is clicked', () => {
    const setCVData = vi.fn();
    render(<EducationEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add education/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when university changes', () => {
    const setCVData = vi.fn();
    render(<EducationEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('AGH'), { target: { value: 'MIT' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove education is clicked', () => {
    const setCVData = vi.fn();
    render(<EducationEditor cvData={baseCVData} setCVData={setCVData} />);
    const allBtns = screen.getAllByRole('button');
    fireEvent.click(allBtns[allBtns.length - 2]);
    expect(setCVData).toHaveBeenCalled();
  });
});
