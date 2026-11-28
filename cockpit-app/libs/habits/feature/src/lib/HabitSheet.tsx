import { useRef, useEffect, useState } from 'react';
import {
  useEntryMutations,
  type Habit,
  type HabitEntry,
} from '@cockpit-app/habits-data-access';
import { ProgressBar } from '@cockpit-app/habits-ui';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@cockpit-app/shared-react-ui';

interface HabitSheetProps {
  habit: Habit;
  /** Day being logged, `YYYY-MM-DD` (local). */
  date: string;
  /** Existing entry for that date, if any. */
  entry: Pick<HabitEntry, 'numeric_value' | 'text_value'> | null;
  onClose: () => void;
}

export function HabitSheet({ habit, date, entry, onClose }: HabitSheetProps) {
  const { upsertEntry } = useEntryMutations();
  const isNumeric = habit.type === 'numeric';
  const isText = habit.type === 'text';

  const [numericValue, setNumericValue] = useState<string>(
    entry?.numeric_value?.toString() ?? '',
  );
  const [textValue, setTextValue] = useState<string>(
    entry?.text_value ?? '',
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
        logged_at: date,
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
        logged_at: date,
        text_value: textValue,
      });
    }
  };

  const sheetHeight = isText ? 'h-[90vh]' : 'h-[50vh]';

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        aria-label={`Check in for ${habit.name}`}
        className={`p-6 ${sheetHeight}`}
      >
        <SheetHeader>
          <SheetTitle>{habit.name}</SheetTitle>
        </SheetHeader>

        {isNumeric && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="numeric-input" className="text-muted-foreground">
                {habit.unit ? `Value (${habit.unit})` : 'Value'}
              </Label>
              <Input
                id="numeric-input"
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                className="h-11 text-lg"
                placeholder="0"
                autoFocus
              />
            </div>
            {habit.target_value != null && numericValue !== '' && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{numericValue}</span>
                  <span>
                    {habit.target_value} {habit.unit}
                  </span>
                </div>
                <ProgressBar
                  value={parseFloat(numericValue)}
                  max={habit.target_value}
                  aria-label="Progress to target"
                />
              </div>
            )}
            <SheetFooter>
              <Button type="button" size="lg" onClick={handleNumericConfirm}>
                Confirm
              </Button>
            </SheetFooter>
          </>
        )}

        {isText && (
          <Textarea
            ref={textareaRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextBlur}
            className="flex-1 resize-none"
            placeholder="Write your diary entry..."
            aria-label={`Diary entry for ${habit.name}`}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
