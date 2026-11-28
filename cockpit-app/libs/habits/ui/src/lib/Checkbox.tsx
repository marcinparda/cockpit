import type { ReactNode } from 'react';
import { cn } from '@cockpit-app/shared-utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label; clicking it toggles the box. */
  children: ReactNode;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  className,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary"
      />
      {children}
    </label>
  );
}
