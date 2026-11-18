import * as React from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@cockpit-app/shared-utils';
import { Button } from '../Button/Button';

export type LogRowValue = 'done' | 'notDone' | 'unset';

export interface LogRowProps {
  /** Icon element rendered inside the colour badge. */
  icon: React.ReactNode;
  /** Badge background colour (any CSS colour). */
  color?: string;
  title: string;
  /** Optional content under the title (e.g. progress `3/8`). */
  subtitle?: React.ReactNode;
  /** Optional trailing content next to the title (e.g. streak badge). */
  badge?: React.ReactNode;
  /** Three-state value: done / not done / unset. */
  value: LogRowValue;
  onSelectDone: () => void;
  onSelectNotDone: () => void;
  onRowClick: () => void;
  className?: string;
}

/**
 * Presentational row with an icon badge, title and ✗/✓ toggle buttons.
 * Holds no business logic, data fetching or routing — callers decide what
 * the callbacks do.
 */
export function LogRow({
  icon,
  color = '#6b7280',
  title,
  subtitle,
  badge,
  value,
  onSelectDone,
  onSelectNotDone,
  onRowClick,
  className,
}: LogRowProps) {
  return (
    <div
      data-testid="log-row"
      data-value={value}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-2 transition-colors',
        value === 'done' && 'bg-green-50 dark:bg-green-900/20',
        value === 'notDone' && 'bg-muted/60',
        className,
      )}
    >
      <button
        type="button"
        onClick={onRowClick}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm font-medium',
              value === 'notDone' && 'text-muted-foreground line-through',
            )}
            title={title}
          >
            {title}
          </span>
          {subtitle != null && (
            <span className="block text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        {badge}
      </button>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          size="icon"
          variant={value === 'notDone' ? 'destructive' : 'outline'}
          aria-label={`Mark ${title} not done`}
          aria-pressed={value === 'notDone'}
          onClick={onSelectNotDone}
        >
          <X aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={value === 'done' ? 'default' : 'outline'}
          className={
            value === 'done'
              ? 'bg-green-600 text-white hover:bg-green-600/90'
              : undefined
          }
          aria-label={`Mark ${title} done`}
          aria-pressed={value === 'done'}
          onClick={onSelectDone}
        >
          <Check aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
