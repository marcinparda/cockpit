import { cn } from '@cockpit-app/shared-utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  'aria-label'?: string;
}

export function ProgressBar({
  value,
  max,
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const pct = Number.isFinite(value) && max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Number.isFinite(value) ? value : undefined}
      className={cn('h-2 w-full rounded-full bg-muted', className)}
    >
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
