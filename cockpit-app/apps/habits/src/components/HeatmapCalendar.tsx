interface HeatmapCalendarProps {
  entries: Record<string, boolean>;
  color: string;
  weeks?: number;
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildCells(weeks: number): Date[] {
  const cells: Date[] = [];
  const today = new Date();
  // Align to start of current week (Sunday)
  const dayOfWeek = today.getDay();
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() - dayOfWeek + 6);

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

export function HeatmapCalendar({ entries, color, weeks = 12 }: HeatmapCalendarProps) {
  const cells = buildCells(weeks);

  return (
    <div
      role="grid"
      aria-label="Habit completion heatmap"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${weeks}, 1fr)`,
        gridTemplateRows: 'repeat(7, 1fr)',
        gap: '2px',
        gridAutoFlow: 'column',
      }}
    >
      {cells.map((date) => {
        const key = getDateKey(date);
        const completed = entries[key] ?? false;
        return (
          <div
            key={key}
            role="gridcell"
            aria-label={`${key}: ${completed ? 'completed' : 'not completed'}`}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: completed ? color : 'var(--color-muted, #e5e7eb)',
              opacity: completed ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
