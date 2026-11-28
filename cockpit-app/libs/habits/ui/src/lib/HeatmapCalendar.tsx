import { useEffect, useRef } from 'react';
import { toDateKey } from './utils/date';

export type HeatmapState = 'done' | 'notDone' | 'unlogged';

interface HeatmapCalendarProps {
  /** Per-date state, keyed `YYYY-MM-DD` (local). Missing date = unlogged. */
  entries: Record<string, HeatmapState>;
  color: string;
  weeks?: number;
  onCellClick?: (date: string, state: HeatmapState) => void;
}

const STATE_LABEL: Record<HeatmapState, string> = {
  done: 'done',
  notDone: 'not done',
  unlogged: 'unlogged',
};

function buildCells(weeks: number): Date[] {
  const cells: Date[] = [];
  const today = new Date();
  // Align to end of current week (Saturday)
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() - today.getDay() + 6);

  const totalDays = weeks * 7;
  const startDate = new Date(endOfGrid);
  startDate.setDate(endOfGrid.getDate() - totalDays + 1);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/** First and last day (local `YYYY-MM-DD`) covered by the heatmap grid. */
export function heatmapRange(weeks = 12): { startDate: string; endDate: string } {
  const cells = buildCells(weeks);
  return {
    startDate: toDateKey(cells[0]),
    endDate: toDateKey(cells[cells.length - 1]),
  };
}

function cellStyle(state: HeatmapState, color: string): React.CSSProperties {
  switch (state) {
    case 'done':
      return { backgroundColor: color };
    case 'notDone':
      // Solid red: distinct from habit color (done) and faint grey (unlogged)
      return { backgroundColor: '#ef4444' };
    default:
      return {
        backgroundColor: 'var(--color-muted, #e5e7eb)',
        opacity: 0.4,
      };
  }
}

/** Same cell size for every period; long periods scroll horizontally. 13 weeks (3M) fit a 375px phone. */
const CELL_PX = 20;
const GAP_PX = 3;

export function HeatmapCalendar({
  entries,
  color,
  weeks = 12,
  onCellClick,
}: HeatmapCalendarProps) {
  const cells = buildCells(weeks);
  const todayKey = toDateKey(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Long ranges overflow: keep the most recent weeks (right edge) in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <div ref={scrollRef} className="overflow-x-auto">
    <div
      role="grid"
      aria-label="Habit completion heatmap"
      className="ml-auto w-max"
      style={{
        display: 'grid',
        gap: `${GAP_PX}px`,
        gridTemplateColumns: `repeat(${weeks}, ${CELL_PX}px)`,
        gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
        gridAutoFlow: 'column',
      }}
    >
      {cells.map((date) => {
        const key = toDateKey(date);
        const state = entries[key] ?? 'unlogged';
        const future = key > todayKey;
        // Days later this week: keep the grid slot, show nothing
        if (future) return <div key={key} aria-hidden="true" />;
        return (
          <button
            key={key}
            type="button"
            role="gridcell"
            aria-label={`${key}: ${STATE_LABEL[state]}`}
            onClick={() => onCellClick?.(key, state)}
            className="rounded-[3px] p-0"
            style={cellStyle(state, color)}
          />
        );
      })}
    </div>
    </div>
  );
}
