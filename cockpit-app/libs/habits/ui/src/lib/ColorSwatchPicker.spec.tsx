import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ColorSwatchPicker } from './ColorSwatchPicker';

const COLORS = ['#ef4444', '#22c55e', '#3b82f6'];

describe('ColorSwatchPicker', () => {
  it('renders one labelled swatch per colour', () => {
    render(<ColorSwatchPicker colors={COLORS} value="#22c55e" onChange={vi.fn()} />);
    for (const c of COLORS) {
      expect(screen.getByRole('button', { name: c })).toHaveStyle({ backgroundColor: c });
    }
  });

  it('marks only the selected colour as pressed', () => {
    render(<ColorSwatchPicker colors={COLORS} value="#22c55e" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '#22c55e' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '#ef4444' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the clicked colour', () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker colors={COLORS} value="#22c55e" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '#3b82f6' }));
    expect(onChange).toHaveBeenCalledWith('#3b82f6');
  });

  it('groups swatches under an accessible name when given', () => {
    render(
      <ColorSwatchPicker colors={COLORS} value="" onChange={vi.fn()} aria-label="Habit colour" />,
    );
    expect(screen.getByRole('group', { name: 'Habit colour' })).toBeInTheDocument();
  });

  it.each([
    ['sm', 'h-5'],
    ['md', 'h-7'],
    ['lg', 'h-8'],
  ] as const)('applies the %s size', (size, cls) => {
    render(<ColorSwatchPicker colors={COLORS} value="" onChange={vi.fn()} size={size} />);
    expect(screen.getByRole('button', { name: '#ef4444' })).toHaveClass(cls);
  });
});
