import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { Habit } from '../api/schemas';
import { useEntryMutations } from '../api/hooks/useEntryMutations';
import { HABIT_ICONS } from '../icons';
import { truncateName } from '../utils/text';

interface HabitTileProps {
  habit: Habit;
  completed: boolean;
  todayEntry: NonNullable<Habit['today_entry']> | null;
  onOpenSheet?: (habit: Habit) => void;
}

export function HabitTile({
  habit,
  completed,
  todayEntry,
  onOpenSheet,
}: HabitTileProps) {
  const navigate = useNavigate();
  const { upsertEntry, deleteEntry } = useEntryMutations();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const Icon = HABIT_ICONS[habit.icon] ?? Star;
  const today = new Date().toISOString().split('T')[0];

  const handleClick = () => {
    if (didLongPress.current) return;
    if (habit.type === 'boolean') {
      if (completed && todayEntry) {
        deleteEntry.mutate({ habitId: habit.id, entryId: todayEntry.id });
      } else {
        upsertEntry.mutate({
          habitId: habit.id,
          logged_at: today,
          boolean_value: true,
        });
      }
    } else {
      onOpenSheet?.(habit);
    }
  };

  const handlePointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      void navigate(`/habits/${habit.id}`);
    }, 300);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const tileStyle = completed
    ? { backgroundColor: habit.color ?? '#6b7280' }
    : { borderColor: habit.color ?? '#6b7280', borderWidth: 2 };

  return (
    <button
      type="button"
      className="relative flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={tileStyle}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label={`${habit.name}${completed ? ' (completed)' : ''}`}
      aria-pressed={completed}
    >
      <Icon
        size={28}
        aria-hidden="true"
        className={completed ? 'opacity-60' : ''}
      />
      {habit.streak_mode !== 'none' && habit.current_streak > 0 && (
        <span
          data-testid="streak-badge"
          className="absolute left-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/30 px-1 text-[10px] font-semibold leading-none"
        >
          {habit.current_streak}
        </span>
      )}
      {completed && (
        <span
          data-testid="checkmark"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/30"
        >
          <Check size={12} className="text-white" aria-hidden="true" />
        </span>
      )}
      <span
        className="w-full break-words px-1 text-center text-[12px] leading-tight"
        title={habit.name}
      >
        {truncateName(habit.name)}
      </span>
      {habit.type === 'numeric' && todayEntry?.numeric_value != null && (
        <span className="text-[10px] font-semibold leading-none" style={{ color: completed ? 'white' : (habit.color ?? '#6b7280') }}>
          {todayEntry.numeric_value}{habit.target_value != null ? `/${habit.target_value}` : ''}
        </span>
      )}
    </button>
  );
}
