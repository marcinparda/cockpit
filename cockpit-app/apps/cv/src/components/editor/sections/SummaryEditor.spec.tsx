import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SummaryEditor } from './SummaryEditor';
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
  summary: ['First paragraph.', 'Second paragraph.'],
  skills: [],
  achievements: [],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('SummaryEditor', () => {
  it('renders a textarea for each summary paragraph', () => {
    render(<SummaryEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('First paragraph.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second paragraph.')).toBeInTheDocument();
  });

  it('calls setCVData when paragraph text changes', () => {
    const setCVData = vi.fn();
    render(<SummaryEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('First paragraph.'), {
      target: { value: 'Updated paragraph.' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Paragraph button', () => {
    render(<SummaryEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add paragraph/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Paragraph is clicked', () => {
    const setCVData = vi.fn();
    render(<SummaryEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add paragraph/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove paragraph is clicked', () => {
    const setCVData = vi.fn();
    render(<SummaryEditor cvData={baseCVData} setCVData={setCVData} />);
    const allBtns = screen.getAllByRole('button');
    fireEvent.click(allBtns[0]);
    expect(setCVData).toHaveBeenCalledOnce();
  });
});
