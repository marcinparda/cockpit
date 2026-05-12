import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

const defaultProps = {
  isOpen: true,
  targetPresetLabel: 'Senior Frontend',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('UnsavedChangesDialog', () => {
  it('renders when isOpen is true', () => {
    render(<UnsavedChangesDialog {...defaultProps} />);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('shows the target preset label in the message', () => {
    render(<UnsavedChangesDialog {...defaultProps} />);
    expect(screen.getByText('Senior Frontend')).toBeInTheDocument();
  });

  it('calls onConfirm when Discard changes button is clicked', () => {
    const onConfirm = vi.fn();
    render(<UnsavedChangesDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Stay here button is clicked', () => {
    const onCancel = vi.fn();
    render(<UnsavedChangesDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /stay here/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders nothing when isOpen is false', () => {
    render(<UnsavedChangesDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });
});
