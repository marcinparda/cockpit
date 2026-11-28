import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { SortableHabitRow, type SortableHabit } from './SortableHabitRow';

const baseHabit: SortableHabit = {
  id: 'habit-1',
  name: 'Morning Run',
  icon: 'Running',
  color: '#ff6b6b',
  category_name: undefined,
  is_archived: false,
  sort_order: 0,
};

function withRouter(ui: React.ReactElement) {
  return <MemoryRouter>{ui}</MemoryRouter>;
}

describe('SortableHabitRow', () => {
  it('renders drag handle and habit name', () => {
    render(
      withRouter(
        <SortableHabitRow habit={baseHabit} onEdit={vi.fn()} onArchive={vi.fn()} />,
      ),
    );
    expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('renders short names unchanged', () => {
    render(
      withRouter(
        <SortableHabitRow habit={baseHabit} onEdit={vi.fn()} onArchive={vi.fn()} />,
      ),
    );
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('truncates names over 50 chars and keeps full name in title attribute', () => {
    const longName = 'b'.repeat(60);
    const longHabit = { ...baseHabit, name: longName };
    render(
      withRouter(
        <SortableHabitRow habit={longHabit} onEdit={vi.fn()} onArchive={vi.fn()} />,
      ),
    );
    const expected = `${'b'.repeat(50)}…`;
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByText(expected)).toHaveAttribute('title', longName);
  });
});
