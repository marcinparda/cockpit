import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Habit } from '../api/schemas';
import { useEntryMutations } from '../api/hooks/useEntryMutations';

interface HabitSheetProps {
  habit: Habit;
  todayEntry: NonNullable<Habit['today_entry']> | null;
  onClose: () => void;
}

export function HabitSheet({ habit, todayEntry, onClose }: HabitSheetProps) {
  const { upsertEntry } = useEntryMutations();
  const today = new Date().toISOString().split('T')[0];
  const isNumeric = habit.type === 'numeric';
  const isText = habit.type === 'text';

  const [numericValue, setNumericValue] = useState<string>(
    todayEntry?.numeric_value?.toString() ?? '',
  );
  const [textValue, setTextValue] = useState<string>(
    todayEntry?.text_value ?? '',
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isText && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isText]);

  const handleNumericConfirm = () => {
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      upsertEntry.mutate({
        habitId: habit.id,
        logged_at: today,
        numeric_value: parsed,
        numeric_unit: habit.unit,
      });
    }
    onClose();
  };

  const handleTextBlur = () => {
    if (textValue.trim()) {
      upsertEntry.mutate({
        habitId: habit.id,
        logged_at: today,
        text_value: textValue,
      });
    }
  };

  const sheetHeight = isText ? 'h-[90vh]' : 'h-[50vh]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Check in for ${habit.name}`}
      className="fixed inset-0 z-[60] flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className={`relative w-full rounded-t-2xl bg-white p-6 dark:bg-gray-900 ${sheetHeight} flex flex-col gap-4`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{habit.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {isNumeric && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="numeric-input" className="text-sm text-gray-500">
                {habit.unit ? `Value (${habit.unit})` : 'Value'}
              </label>
              <input
                id="numeric-input"
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                className="rounded-lg border px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                autoFocus
              />
            </div>
            {habit.target_value != null && numericValue !== '' && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{numericValue}</span>
                  <span>
                    {habit.target_value} {habit.unit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.min(100, (parseFloat(numericValue) / habit.target_value) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleNumericConfirm}
              className="mt-auto rounded-xl bg-blue-500 py-3 text-white font-medium hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Confirm
            </button>
          </>
        )}

        {isText && (
          <textarea
            ref={textareaRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextBlur}
            className="flex-1 resize-none rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your diary entry..."
            aria-label={`Diary entry for ${habit.name}`}
          />
        )}
      </div>
    </div>
  );
}
