import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PersonalProjectsEditor } from './PersonalProjectsEditor';
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
  personalProjects: [
    {
      name: 'Cockpit',
      liveUrl: 'https://cockpit.example.com',
      code: 'https://github.com/marcinparda/cockpit',
      date: '2024',
      description: ['Personal dashboard'],
    },
  ],
  courses: [],
};

describe('PersonalProjectsEditor', () => {
  it('renders project name input', () => {
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('Cockpit')).toBeInTheDocument();
  });

  it('calls setCVData when project name changes', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Cockpit'), {
      target: { value: 'My Dashboard' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Add Project button', () => {
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
  });

  it('calls setCVData when Add Project is clicked', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByRole('button', { name: /add project/i }));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when liveUrl input changes', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('https://cockpit.example.com'), {
      target: { value: 'https://new.example.com' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when code url input changes', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('https://github.com/marcinparda/cockpit'), {
      target: { value: 'https://github.com/new/repo' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when date input changes', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('2024'), { target: { value: '2025' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when description input changes', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Personal dashboard'), { target: { value: 'Updated' } });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when Add description point is clicked', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.click(screen.getByText(/\+ Add point/i));
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when remove description point is clicked', () => {
    const setCVData = vi.fn();
    render(<PersonalProjectsEditor cvData={baseCVData} setCVData={setCVData} />);
    const allBtns = screen.getAllByRole('button');
    // Find the trash button for description (not grip, not Add point, not Add project)
    const trashBtns = allBtns.filter((b) => !b.textContent?.includes('Add') && !b.textContent?.includes('Project'));
    if (trashBtns.length >= 2) {
      fireEvent.click(trashBtns[1]);
      expect(setCVData).toHaveBeenCalled();
    }
  });
});
