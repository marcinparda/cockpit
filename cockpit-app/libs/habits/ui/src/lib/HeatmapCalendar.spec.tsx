import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { toDateKey, addDays } from './utils/date';
import { HeatmapCalendar, heatmapRange } from './HeatmapCalendar';

/** Cheap whole-heatmap cell query; role queries are slow in jsdom. */
const gridCells = () =>
  document.querySelectorAll('[role="grid"][aria-label="Habit completion heatmap"] [role="gridcell"]');

/** Days after today in the current Sun–Sat week are not rendered. */
const FUTURE_DAYS_THIS_WEEK = 6 - new Date().getDay();

describe('HeatmapCalendar', () => {
  it('renders correct number of cells for a 12-week range', () => {
    const entries = {};
    render(
      <HeatmapCalendar
        entries={entries}
        color="#22c55e"
        weeks={12}
      />,
    );

    // 12 weeks × 7 days = 84 cells
    expect(gridCells()).toHaveLength(84 - FUTURE_DAYS_THIS_WEEK);
  });
});

describe('HeatmapCalendar states', () => {
  const today = toDateKey(new Date());
  const yesterday = addDays(today, -1);

  it('labels done / not done / unlogged distinctly', () => {
    render(
      <HeatmapCalendar
        entries={{ [today]: 'done', [yesterday]: 'notDone' }}
        color="#22c55e"
      />,
    );
    expect(screen.getByRole('gridcell', { name: `${today}: done` })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: `${yesterday}: not done` })).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: `${addDays(today, -2)}: unlogged` }),
    ).toBeInTheDocument();
  });

  it('does not render days after today and reports clicks on past cells', () => {
    const onCellClick = vi.fn();
    render(<HeatmapCalendar entries={{}} color="#22c55e" onCellClick={onCellClick} />);
    expect(screen.queryByRole('gridcell', { name: `${addDays(today, 1)}: unlogged` })).toBeNull();
    expect(screen.getByRole('gridcell', { name: `${today}: unlogged` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('gridcell', { name: `${yesterday}: unlogged` }));
    expect(onCellClick).toHaveBeenCalledWith(yesterday, 'unlogged');
  });
});

describe('heatmapRange', () => {
  it('spans whole weeks ending on this week\'s Saturday', () => {
    const { startDate, endDate } = heatmapRange(2);
    const today = new Date();
    const saturday = toDateKey(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6),
    );
    expect(endDate).toBe(saturday);
    expect(startDate).toBe(addDays(saturday, -13));
  });
});
