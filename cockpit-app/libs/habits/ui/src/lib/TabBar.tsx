import { cn } from '@cockpit-app/shared-utils';

interface TabBarItem<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: readonly TabBarItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Full-width underline tabs; the caller renders the active panel. */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabBarProps<T>) {
  return (
    <div role="tablist" className={cn('flex border-b', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px flex-1 border-b-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
