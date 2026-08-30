import { HABIT_ICONS } from '../icons/index';

interface IconPickerProps {
  selected: string;
  onSelect: (iconKey: string) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  return (
    <div
      className="flex flex-wrap gap-2 pb-2"
      role="group"
      aria-label="Select habit icon"
    >
      {Object.entries(HABIT_ICONS).map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          aria-label={key}
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
            selected === key
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-transparent bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
        >
          <Icon size={20} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
