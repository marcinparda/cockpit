import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { DayStrip } from './DayStrip';

// 2026-11-18 is a Wednesday → week Mon 16 … Sun 22
describe('DayStrip', () => {
  const base = { today: '2026-11-18', onSelect: vi.fn(), onToday: vi.fn() };

  it('renders Mon–Sun, disables future days, marks completion', () => {
    render(
      <DayStrip
        {...base}
        selected="2026-11-18"
        completion={{ '2026-11-16': 'full', '2026-11-17': 'partial' }}
      />,
    );
    const days = screen.getAllByRole('button').filter((b) => b.hasAttribute('data-completion'));
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveAttribute('data-completion', 'full');
    expect(days[1]).toHaveAttribute('data-completion', 'partial');
    expect(days[2]).toHaveAttribute('data-completion', 'empty');
    expect(days[3]).toBeDisabled();
    expect(days[6]).toBeDisabled();
    expect(days[0]).not.toBeDisabled();
  });

  it('arrows move by one day; crossing a week shifts the strip', () => {
    const onSelect = vi.fn();
    render(<DayStrip {...base} onSelect={onSelect} selected="2026-11-16" completion={{}} />);
    fireEvent.click(screen.getByLabelText('Previous day'));
    expect(onSelect).toHaveBeenCalledWith('2026-11-15');
  });

  it('next arrow disabled on today; Today control only when elsewhere', () => {
    const { rerender } = render(<DayStrip {...base} selected="2026-11-18" completion={{}} />);
    expect(screen.getByLabelText('Next day')).toBeDisabled();
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    rerender(<DayStrip {...base} selected="2026-11-15" completion={{}} />);
    fireEvent.click(screen.getByText('Today'));
    expect(base.onToday).toHaveBeenCalled();
    expect(screen.getAllByRole('button').filter((b) => b.hasAttribute('data-completion'))[0]).toHaveAttribute(
      'aria-label',
      'Monday, November 9',
    );
  });
});
