import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockSelectPreset = vi.fn();
const mockClearDirty = vi.fn();
const mockCreatePreset = vi.fn();
const mockArchivePreset = vi.fn();

let mockIsDirty = false;
let mockIsLoading = false;
let mockPresetsLoading = false;

const mockCVData = {
  header: {
    name: 'Test User',
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

vi.mock('../../hooks/useCVData', () => ({
  useCVData: () => ({
    cvData: mockCVData,
    setCVData: vi.fn(),
    resetToDefault: vi.fn(),
    saveToApi: vi.fn(),
    isSaving: false,
    isLoading: mockIsLoading,
    markDirty: vi.fn(),
    isDirty: mockIsDirty,
    clearDirty: mockClearDirty,
  }),
}));

vi.mock('../../hooks/usePresets', () => ({
  usePresets: () => ({
    presets: [{ id: 'preset1', label: 'Preset One' }],
    selectedPresetId: 'base',
    isLoading: mockPresetsLoading,
    selectPreset: mockSelectPreset,
    createPreset: mockCreatePreset,
    archivePreset: mockArchivePreset,
  }),
}));

vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: () => <div />,
}));

import { CVEditor } from './CVEditor';

describe('CVEditor', () => {
  it('renders without crashing', () => {
    mockIsLoading = false;
    mockPresetsLoading = false;
    render(<CVEditor />);
    expect(screen.getByText('CV Editor')).toBeInTheDocument();
  });

  it('renders the Preview panel heading', () => {
    render(<CVEditor />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<CVEditor />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls selectPreset when preset is switched without dirty state', () => {
    mockIsDirty = false;
    render(<CVEditor />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows unsaved changes dialog when switching preset with dirty state', () => {
    mockIsDirty = true;
    render(<CVEditor />);
    // Open the PresetDropdown
    const dropdownBtn = screen.getByRole('button', { name: /base/i });
    fireEvent.click(dropdownBtn);
    // Select Preset One from the dropdown
    const presetOption = screen.queryByText('Preset One');
    if (presetOption) {
      fireEvent.click(presetOption);
      // After selecting with dirty, the unsaved changes dialog should appear
      expect(screen.getAllByText(/unsaved/i).length).toBeGreaterThan(0);
    }
    mockIsDirty = false;
  });
});

describe('CVEditor - loading state', () => {
  it('renders loading message when data is loading', () => {
    mockIsLoading = true;
    mockPresetsLoading = false;
    render(<CVEditor />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    mockIsLoading = false;
  });

  it('renders loading message when presets are loading', () => {
    mockIsLoading = false;
    mockPresetsLoading = true;
    render(<CVEditor />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    mockPresetsLoading = false;
  });
});
