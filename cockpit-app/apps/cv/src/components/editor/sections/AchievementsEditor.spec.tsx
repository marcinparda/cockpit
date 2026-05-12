import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AchievementsEditor } from './AchievementsEditor';
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
  achievements: [{ title: 'Shipped v2', description: 'Full rewrite in 3 months.' }],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('AchievementsEditor', () => {
  it('renders title and description inputs for each achievement', () => {
    render(<AchievementsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('Shipped v2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Full rewrite in 3 months.')).toBeInTheDocument();
  });

  it('calls setCVData when title input changes', () => {
    const setCVData = vi.fn();
    render(<AchievementsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Shipped v2'), { target: { value: 'New title' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Achievement button', () => {
    render(<AchievementsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add achievement/i })).toBeInTheDocument();
  });

  it('renders empty state without crashing when achievements list is empty', () => {
    const data = { ...baseCVData, achievements: [] };
    render(<AchievementsEditor cvData={data} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add achievement/i })).toBeInTheDocument();
  });

  it('calls setCVData when description input changes', () => {
    const setCVData = vi.fn();
    render(<AchievementsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Full rewrite in 3 months.'), { target: { value: 'Updated desc' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when Add Achievement is clicked', () => {
    const setCVData = vi.fn();
    render(<AchievementsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add achievement/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove button is clicked', () => {
    const setCVData = vi.fn();
    render(<AchievementsEditor cvData={baseCVData} setCVData={setCVData} />);
    const removeBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg'));
    const allBtns = screen.getAllByRole('button');
    // Remove button is the last button in the item (trash icon)
    fireEvent.click(allBtns[allBtns.length - 1]);
    expect(setCVData).toHaveBeenCalled();
  });
});
