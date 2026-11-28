import { cn } from '@cockpit-app/shared-utils';

type SwatchSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SwatchSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
};

interface ColorSwatchPickerProps {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  /** sm = inline edit row, md/lg grow the selected swatch slightly. */
  size?: SwatchSize;
  className?: string;
  'aria-label'?: string;
}

export function ColorSwatchPicker({
  colors,
  value,
  onChange,
  size = 'lg',
  className,
  'aria-label': ariaLabel,
}: ColorSwatchPickerProps) {
  return (
    <div
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      className={cn('flex flex-wrap', size === 'sm' ? 'gap-1' : 'gap-2', className)}
    >
      {colors.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={selected}
            onClick={() => onChange(c)}
            className={cn(
              'rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              SIZE_CLASSES[size],
              selected ? 'border-foreground' : 'border-transparent',
              selected && size !== 'sm' && 'scale-110',
            )}
            style={{ backgroundColor: c }}
          />
        );
      })}
    </div>
  );
}
