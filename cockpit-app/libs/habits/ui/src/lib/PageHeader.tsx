import type { ReactNode } from 'react';
import { cn } from '@cockpit-app/shared-utils';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Rendered before the title, e.g. a habit icon tile. */
  leading?: ReactNode;
  /** Rendered on the right, e.g. page-level buttons. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  leading,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
