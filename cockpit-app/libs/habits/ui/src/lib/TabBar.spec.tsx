import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { TabBar } from './TabBar';

const TABS = [
  { id: 'quick-add', label: 'Quick Add' },
  { id: 'browse', label: 'Browse Templates' },
] as const;

describe('TabBar', () => {
  it('renders a tablist with one tab per item', () => {
    render(<TabBar tabs={TABS} value="quick-add" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('marks the active tab as selected', () => {
    render(<TabBar tabs={TABS} value="browse" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Browse Templates' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Quick Add' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the clicked tab id', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={TABS} value="quick-add" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Browse Templates' }));
    expect(onChange).toHaveBeenCalledWith('browse');
  });
});
