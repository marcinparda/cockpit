import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox named by its label', () => {
    render(<Checkbox checked={false} onCheckedChange={vi.fn()}>Show archived</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Show archived' })).not.toBeChecked();
  });

  it('reflects the checked state', () => {
    render(<Checkbox checked onCheckedChange={vi.fn()}>Show archived</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Show archived' })).toBeChecked();
  });

  it('reports the new state when the label is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange}>Show archived</Checkbox>);
    fireEvent.click(screen.getByText('Show archived'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
