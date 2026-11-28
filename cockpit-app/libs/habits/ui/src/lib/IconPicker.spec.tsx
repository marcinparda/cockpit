import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { IconPicker } from './IconPicker';
import { HABIT_ICONS } from './icons';

describe('IconPicker', () => {
  it('renders a button for every available icon', () => {
    render(<IconPicker selected="Star" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(
      Object.keys(HABIT_ICONS).length,
    );
  });

  it('wraps icons in a flex-wrap container instead of horizontal scroll', () => {
    render(<IconPicker selected="Star" onSelect={vi.fn()} />);
    const group = screen.getByRole('group', { name: /select habit icon/i });
    expect(group.className).toContain('flex-wrap');
    expect(group.className).not.toContain('overflow-x-auto');
  });

  it('marks the selected icon as pressed', () => {
    render(<IconPicker selected="Home" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('calls onSelect with the clicked icon key', () => {
    const onSelect = vi.fn();
    render(<IconPicker selected="Star" onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelect).toHaveBeenCalledWith(Object.keys(HABIT_ICONS)[0]);
  });
});
