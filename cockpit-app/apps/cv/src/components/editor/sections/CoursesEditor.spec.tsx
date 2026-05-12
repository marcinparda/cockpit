import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CoursesEditor } from './CoursesEditor';
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
  education: [],
  personalProjects: [],
  courses: ['Advanced TypeScript', 'Docker Mastery'],
};

describe('CoursesEditor', () => {
  it('renders an input for each course', () => {
    render(<CoursesEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Docker Mastery')).toBeInTheDocument();
  });

  it('calls setCVData when a course input changes', () => {
    const setCVData = vi.fn();
    render(<CoursesEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Advanced TypeScript'), {
      target: { value: 'Updated Course' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Course button', () => {
    render(<CoursesEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add course/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Course is clicked', () => {
    const setCVData = vi.fn();
    render(<CoursesEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add course/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove course button is clicked', () => {
    const setCVData = vi.fn();
    render(<CoursesEditor cvData={baseCVData} setCVData={setCVData} />);
    // The trash buttons follow each drag handle: [grip1, trash1, grip2, trash2, addBtn]
    const allBtns = screen.getAllByRole('button');
    // Click the second button which is the first trash icon
    fireEvent.click(allBtns[1]);
    expect(setCVData).toHaveBeenCalledOnce();
  });
});
