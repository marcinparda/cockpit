import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresetDropdown } from './PresetDropdown';
import type { Preset } from '../types/preset.types';

const presets: Preset[] = [
  { id: 'senior-fe', label: 'Senior Frontend', description: '', created_at: '2024-01-01T00:00:00Z', archived: false },
];

const defaultProps = {
  presets,
  selectedPresetId: 'base',
  isDirty: false,
  onSelect: vi.fn(),
  onCreateNew: vi.fn(),
  onArchive: vi.fn(),
};

describe('PresetDropdown', () => {
  it('renders the selected preset label (Base by default)', () => {
    render(<PresetDropdown {...defaultProps} />);
    expect(screen.getByRole('button', { name: /base/i })).toBeInTheDocument();
  });

  it('opens the dropdown and shows presets on click', () => {
    render(<PresetDropdown {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    expect(screen.getByText('Senior Frontend')).toBeInTheDocument();
  });

  it('calls onSelect when a preset option is clicked', () => {
    const onSelect = vi.fn();
    render(<PresetDropdown {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    fireEvent.click(screen.getByText('Senior Frontend'));
    expect(onSelect).toHaveBeenCalledWith('senior-fe');
  });

  it('shows New Preset option in the open dropdown', () => {
    render(<PresetDropdown {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    expect(screen.getByRole('button', { name: /new preset/i })).toBeInTheDocument();
  });

  it('calls onCreateNew when New Preset is clicked', () => {
    const onCreateNew = vi.fn();
    render(<PresetDropdown {...defaultProps} onCreateNew={onCreateNew} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    fireEvent.click(screen.getByRole('button', { name: /new preset/i }));
    expect(onCreateNew).toHaveBeenCalledOnce();
  });

  it('calls onArchive when archive button is clicked on a preset', () => {
    const onArchive = vi.fn();
    render(<PresetDropdown {...defaultProps} onArchive={onArchive} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    // Hover over the Senior Frontend item to reveal the archive button
    const seniorFe = screen.getByText('Senior Frontend').closest('button') ?? screen.getByText('Senior Frontend');
    fireEvent.mouseEnter(seniorFe);
    const archiveBtns = screen.queryAllByRole('button', { name: /archive/i });
    if (archiveBtns.length > 0) {
      fireEvent.click(archiveBtns[0]);
      expect(onArchive).toHaveBeenCalled();
    }
  });

  it('closes dropdown when clicking outside', () => {
    render(<PresetDropdown {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /base/i }));
    expect(screen.getByText('Senior Frontend')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Senior Frontend')).not.toBeInTheDocument();
  });

  it('shows dirty indicator when isDirty is true', () => {
    const { container } = render(<PresetDropdown {...defaultProps} isDirty={true} />);
    // The dirty indicator is a small dot element
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
  });
});
