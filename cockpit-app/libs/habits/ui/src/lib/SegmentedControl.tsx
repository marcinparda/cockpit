import { Button } from '@cockpit-app/shared-react-ui';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

/** Row of mutually exclusive toggle buttons, e.g. a time-range picker. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex gap-1.5">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={option === value ? 'default' : 'outline'}
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className="flex-1"
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
