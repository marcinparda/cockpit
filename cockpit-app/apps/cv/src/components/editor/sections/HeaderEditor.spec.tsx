import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HeaderEditor } from './HeaderEditor';
import type { CVData } from '../../../types/cv.types';

const baseCVData: CVData = {
  header: {
    name: 'Jane Doe',
    title: 'Engineer',
    phone: '+48 000 000 000',
    email: 'jane@example.com',
    linkedin: { url: 'linkedin.com/in/jane', text: 'jane' },
    location: 'Krakow',
  },
  summary: [],
  skills: [],
  achievements: [],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
};

describe('HeaderEditor', () => {
  it('renders inputs for all header fields', () => {
    render(<HeaderEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Krakow')).toBeInTheDocument();
  });

  it('calls setCVData when name input changes', () => {
    const setCVData = vi.fn();
    render(<HeaderEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('Jane Doe'), {
      target: { value: 'John Doe' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('renders Name label text', () => {
    render(<HeaderEditor cvData={baseCVData} setCVData={vi.fn()} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('calls setCVData when email input changes', () => {
    const setCVData = vi.fn();
    render(<HeaderEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('jane@example.com'), {
      target: { value: 'new@example.com' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });

  it('calls setCVData when linkedin url changes', () => {
    const setCVData = vi.fn();
    render(<HeaderEditor cvData={baseCVData} setCVData={setCVData} />);
    fireEvent.change(screen.getByDisplayValue('linkedin.com/in/jane'), {
      target: { value: 'linkedin.com/in/new' },
    });
    expect(setCVData).toHaveBeenCalledOnce();
  });
});
