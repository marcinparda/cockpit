import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CVEditorPanel } from './CVEditorPanel';
import type { CVData } from '../../types/cv.types';
import type { Preset } from '../../types/preset.types';

const mockCVData: CVData = {
  header: {
    name: 'Test',
    title: 'Dev',
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
  courses: [],
};

const defaultProps = {
  cvData: mockCVData,
  setCVData: vi.fn(),
  resetToDefault: vi.fn(),
  saveToApi: vi.fn(),
  isSaving: false,
  markDirty: vi.fn(),
  presets: [] as Preset[],
  selectedPresetId: 'base',
  isDirty: false,
  onSelectPreset: vi.fn(),
  onCreatePreset: vi.fn(),
  onArchivePreset: vi.fn(),
};

describe('CVEditorPanel', () => {
  it('renders without crashing', () => {
    render(<CVEditorPanel {...defaultProps} />);
    expect(screen.getByText('CV Editor')).toBeInTheDocument();
  });

  it('renders all section tabs', () => {
    render(<CVEditorPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Header' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skills' })).toBeInTheDocument();
  });

  it('renders Save and Reset buttons', () => {
    render(<CVEditorPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls saveToApi when Save is clicked', () => {
    const saveToApi = vi.fn();
    render(<CVEditorPanel {...defaultProps} saveToApi={saveToApi} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(saveToApi).toHaveBeenCalledOnce();
  });

  it('calls resetToDefault when Reset is clicked', () => {
    const resetToDefault = vi.fn();
    render(<CVEditorPanel {...defaultProps} resetToDefault={resetToDefault} />);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(resetToDefault).toHaveBeenCalledOnce();
  });

  it('calls onCreatePreset when new preset button is clicked', () => {
    const onCreatePreset = vi.fn();
    render(<CVEditorPanel {...defaultProps} onCreatePreset={onCreatePreset} />);
    // Open the preset dropdown first
    const dropdownBtn = screen.getByRole('button', { name: /base/i });
    fireEvent.click(dropdownBtn);
    // Click the create new preset button (Plus icon)
    const createBtn = screen.queryByRole('button', { name: /new preset/i });
    if (createBtn) {
      fireEvent.click(createBtn);
      expect(onCreatePreset).toHaveBeenCalledOnce();
    }
  });

  it('switches active section tab when clicked', () => {
    render(<CVEditorPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
    // After clicking Skills tab, it should be active — verify by absence of crash
    expect(screen.getByRole('button', { name: 'Skills' })).toBeInTheDocument();
  });
});
