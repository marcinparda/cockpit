import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { ProgressBar } from './ProgressBar';

function fill() {
  return screen.getByRole('progressbar').firstElementChild as HTMLElement;
}

describe('ProgressBar', () => {
  it('exposes value and max', () => {
    render(<ProgressBar value={4} max={8} aria-label="Progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '4');
    expect(bar).toHaveAttribute('aria-valuemax', '8');
    expect(fill().style.width).toBe('50%');
  });

  it('caps the fill at 100%', () => {
    render(<ProgressBar value={12} max={8} />);
    expect(fill().style.width).toBe('100%');
  });

  it('shows an empty bar for a non-numeric value', () => {
    render(<ProgressBar value={Number.NaN} max={8} />);
    expect(fill().style.width).toBe('0%');
  });
});
