import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewPresetModal } from './NewPresetModal';

const defaultProps = {
  isOpen: true,
  existingSlugs: [],
  onClose: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
};

describe('NewPresetModal', () => {
  it('renders the modal when isOpen is true', () => {
    render(<NewPresetModal {...defaultProps} />);
    expect(screen.getByText('New Preset')).toBeInTheDocument();
  });

  it('renders a Name input', () => {
    render(<NewPresetModal {...defaultProps} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('renders Cancel and Create buttons', () => {
    render(<NewPresetModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    render(<NewPresetModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Preset')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<NewPresetModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<NewPresetModal {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when Create is clicked with a label', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<NewPresetModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My Preset' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(onConfirm).toHaveBeenCalledWith('My Preset', undefined);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<NewPresetModal {...defaultProps} onClose={onClose} />);
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalled();
  });

  it('changes description field', () => {
    render(<NewPresetModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/short description/i);
    fireEvent.change(textarea, { target: { value: 'A description' } });
    expect(textarea).toHaveValue('A description');
  });
});
