import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { IconPicker } from '../components/IconPicker';
import { HABIT_ICONS } from '../icons/index';

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
});
