import { cn } from '@cockpit-app/shared-utils';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = 'Loading', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent',
        className,
      )}
    />
  );
}
