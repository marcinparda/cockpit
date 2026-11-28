import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Switch } from './Switch';

describe('Switch', () => {
  it('exposes its state as a switch', () => {
    render(<Switch checked aria-label="Push" onCheckedChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Push' })).toHaveAttribute('aria-checked', 'true');
  });

  it('requests the opposite state on click', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} aria-label="Push" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does nothing while disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} disabled aria-label="Push" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('passes through extra attributes', () => {
    render(<Switch checked={false} data-testid="toggle" onCheckedChange={vi.fn()} />);
    expect(screen.getByTestId('toggle')).toBeInTheDocument();
  });
});
