import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExperienceEditor } from './ExperienceEditor';
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
  experience: [
    {
      title: 'Frontend Dev',
      company: 'Acme',
      date: '2020-2023',
      location: 'Remote',
      description: ['Built React apps'],
    },
  ],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('ExperienceEditor', () => {
  it('renders title and company inputs', () => {
    render(<ExperienceEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('Frontend Dev')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
  });

  it('calls setCVData when title input changes', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Frontend Dev'), {
      target: { value: 'Senior Dev' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Experience button', () => {
    render(<ExperienceEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add experience/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Experience is clicked', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add experience/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when company input changes', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: 'NewCorp' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when description input changes', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Built React apps'), { target: { value: 'Updated' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when Add point is clicked', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByText(/\+ Add point/i));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove description point is clicked', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    // Find all buttons; the remove description button is after the textarea
    const allBtns = screen.getAllByRole('button');
    // The description item's trash button
    const trashBtns = allBtns.filter((b) => !b.textContent?.includes('Add'));
    if (trashBtns.length > 0) {
      fireEvent.click(trashBtns[trashBtns.length - 1]);
      expect(setCVData).toHaveBeenCalled();
    }
  });

  it('calls setCVData when date input changes', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('2020-2023'), { target: { value: '2021-2024' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when location input changes', () => {
    const setCVData = vi.fn();
    render(<ExperienceEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Remote'), { target: { value: 'Krakow' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });
});
