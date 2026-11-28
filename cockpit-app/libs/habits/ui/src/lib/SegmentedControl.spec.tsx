import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('renders a named group with one button per option', () => {
    render(
      <SegmentedControl options={['6M', '1Y']} value="1Y" onChange={vi.fn()} aria-label="Time range" />,
    );
    const group = screen.getByRole('group', { name: 'Time range' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['6M', '1Y']);
  });

  it('marks the active option as pressed', () => {
    render(
      <SegmentedControl options={['6M', '1Y']} value="1Y" onChange={vi.fn()} aria-label="Time range" />,
    );
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '6M' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen option', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={['6M', '1Y']} value="1Y" onChange={onChange} aria-label="Time range" />,
    );
    fireEvent.click(screen.getByRole('button', { name: '6M' }));
    expect(onChange).toHaveBeenCalledWith('6M');
  });
});
