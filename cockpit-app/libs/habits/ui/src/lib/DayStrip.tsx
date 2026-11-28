import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@cockpit-app/shared-react-ui';
import { addDays, parseDateKey, weekOf } from './utils/date';

export type DayCompletion = 'full' | 'partial' | 'empty';

interface DayStripProps {
  selected: string;
  today: string;
  completion: Record<string, DayCompletion>;
  onSelect: (date: string) => void;
  onToday: () => void;
}

const COMPLETION_STYLE: Record<DayCompletion, string> = {
  full: 'bg-green-600 text-white border-green-600',
  partial: 'bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200',
  empty: 'bg-background text-foreground',
};

export function DayStrip({
  selected,
  today,
  completion,
  onSelect,
  onToday,
}: DayStripProps) {
  const days = weekOf(selected);
  const prev = () => onSelect(addDays(selected, -1));
  const next = () => onSelect(addDays(selected, 1));

  return (
    <div className="flex flex-col gap-2" data-testid="day-strip">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Previous day"
          onClick={prev}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {days.map((day) => {
            const d = parseDateKey(day);
            const future = day > today;
            const state = completion[day] ?? 'empty';
            const isSelected = day === selected;
            return (
              <button
                key={day}
                type="button"
                disabled={future}
                data-completion={state}
                aria-pressed={isSelected}
                aria-label={d.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                onClick={() => onSelect(day)}
                className={`flex flex-col items-center rounded-lg border py-1 text-xs transition-colors disabled:opacity-40 ${COMPLETION_STYLE[state]} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${day === today ? 'font-bold underline underline-offset-2' : ''}`}
              >
                <span>
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-sm">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Next day"
          disabled={selected >= today}
          onClick={next}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      {selected !== today && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-center"
          onClick={onToday}
        >
          Today
        </Button>
      )}
    </div>
  );
}
