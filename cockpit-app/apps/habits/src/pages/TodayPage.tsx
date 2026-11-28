import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LogRow, type LogRowValue } from '@cockpit-app/shared-react-ui';
import {
  Habit,
  HabitEntry,
  useEntriesByRange,
  useEntryMutations,
  useHabits,
} from '@cockpit-app/habits-data-access';
import { HabitSheet } from '../components/HabitSheet';
import {
  ConfettiAnimation,
  DayStrip,
  HABIT_ICONS,
  parseDateKey,
  toDateKey,
  truncateName,
  weekOf,
  type DayCompletion,
} from '@cockpit-app/habits-ui';

type EntryLike = Pick<
  HabitEntry,
  'boolean_value' | 'numeric_value' | 'text_value'
>;

function isDone(habit: Habit, entry: EntryLike | undefined): boolean {
  if (!entry || entry.boolean_value === false) return false;
  if (habit.type === 'boolean') return entry.boolean_value === true;
  if (habit.type === 'numeric') {
    if (entry.numeric_value == null) return false;
    if (habit.target_value != null) return entry.numeric_value >= habit.target_value;
    return true; // no target set: any logged value counts
  }
  return !!entry.text_value?.trim();
}

function rowValue(habit: Habit, entry: EntryLike | undefined): LogRowValue {
  if (isDone(habit, entry)) return 'done';
  if (entry?.boolean_value === false) return 'notDone';
  return 'unset';
}

interface CategoryGroup {
  categoryName: string;
  categoryId: string | null;
  habits: Habit[];
}

function groupByCategory(habits: Habit[]): CategoryGroup[] {
  const grouped = new Map<string, CategoryGroup>();

  for (const habit of habits) {
    const key = habit.category_id ?? '__uncategorized__';
    if (!grouped.has(key)) {
      grouped.set(key, {
        categoryName: habit.category_name ?? 'Uncategorized',
        categoryId: habit.category_id ?? null,
        habits: [],
      });
    }
    grouped.get(key)!.habits.push(habit);
  }

  // Sort: named categories first (alphabetically), uncategorized last
  return Array.from(grouped.values()).sort((a, b) => {
    if (a.categoryId === null && b.categoryId !== null) return 1;
    if (a.categoryId !== null && b.categoryId === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

export default function TodayPage() {
  const navigate = useNavigate();
  const today = toDateKey(new Date());
  const [selected, setSelected] = useState(today);
  const week = useMemo(() => weekOf(selected), [selected]);

  const { data: habits, isLoading } = useHabits();
  const { data: weekEntries } = useEntriesByRange(week[0], week[6]);
  const { upsertEntry, deleteEntry } = useEntryMutations();

  const [activeSheet, setActiveSheet] = useState<Habit | null>(null);
  const [confettiFor, setConfettiFor] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const activeHabits = useMemo(
    () => (habits ?? []).filter((h) => h.is_active && !h.is_archived),
    [habits],
  );

  // habitId -> date -> entry
  const entryIndex = useMemo(() => {
    const idx = new Map<string, EntryLike & { id: string }>();
    for (const e of weekEntries ?? []) idx.set(`${e.habit_id}|${e.logged_at}`, e);
    return idx;
  }, [weekEntries]);

  const entryFor = (habit: Habit, date: string) =>
    entryIndex.get(`${habit.id}|${date}`);

  const completion = useMemo(() => {
    const out: Record<string, DayCompletion> = {};
    for (const day of week) {
      const done = activeHabits.filter((h) =>
        isDone(h, entryIndex.get(`${h.id}|${day}`)),
      ).length;
      out[day] =
        activeHabits.length > 0 && done === activeHabits.length
          ? 'full'
          : done > 0
            ? 'partial'
            : 'empty';
    }
    return out;
  }, [week, activeHabits, entryIndex]);

  const completedCount = useMemo(
    () =>
      activeHabits.filter((h) => isDone(h, entryIndex.get(`${h.id}|${selected}`)))
        .length,
    [activeHabits, entryIndex, selected],
  );

  const allDone =
    activeHabits.length > 0 && completedCount === activeHabits.length;

  // Confetti once per selected day when all habits become done
  useEffect(() => {
    if (allDone && confettiFor !== selected) {
      setShowConfetti(true);
      setConfettiFor(selected);
    }
  }, [allDone, confettiFor, selected]);

  const groups = useMemo(() => groupByCategory(activeHabits), [activeHabits]);

  const isToday = selected === today;
  const dateLabel = parseDateKey(selected).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const selectDone = (habit: Habit) => {
    const entry = entryFor(habit, selected);
    if (habit.type !== 'boolean') {
      setActiveSheet(habit);
      return;
    }
    if (entry?.boolean_value === true) {
      deleteEntry.mutate({ habitId: habit.id, entryId: entry.id });
    } else {
      upsertEntry.mutate({
        habitId: habit.id,
        logged_at: selected,
        boolean_value: true,
      });
    }
  };

  const selectNotDone = (habit: Habit) => {
    const entry = entryFor(habit, selected);
    if (entry?.boolean_value === false) {
      deleteEntry.mutate({ habitId: habit.id, entryId: entry.id });
    } else {
      // Numeric/text: API accepts boolean_value=false on any habit type and
      // treats it as "not done"; this replaces any existing value.
      upsertEntry.mutate({
        habitId: habit.id,
        logged_at: selected,
        boolean_value: false,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground">Loading habits...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      {showConfetti && (
        <ConfettiAnimation onDone={() => setShowConfetti(false)} />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background pb-2 pt-0">
        <DayStrip
          selected={selected}
          today={today}
          completion={completion}
          onSelect={setSelected}
          onToday={() => setSelected(today)}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{isToday ? 'Today' : dateLabel}</h1>
          {activeHabits.length > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount}/{activeHabits.length}
            </span>
          )}
        </div>
        {isToday && <p className="text-sm text-muted-foreground">{dateLabel}</p>}
      </div>

      {/* Empty state */}
      {activeHabits.length === 0 && (
        <div
          data-testid="empty-state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-lg font-medium">No habits yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some habits to start tracking your day.
          </p>
        </div>
      )}

      {/* All-done state */}
      {allDone && (
        <div
          data-testid="all-done-state"
          className="mb-4 rounded-xl bg-green-100 p-4 text-center dark:bg-green-900/30"
        >
          <p className="text-lg font-bold text-green-700 dark:text-green-400">
            {isToday ? 'All done for today!' : 'All done for this day!'}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">
            Great work keeping your streak alive.
          </p>
        </div>
      )}

      {/* Rows grouped by category */}
      {groups.map((group) => (
        <section key={group.categoryId ?? '__uncategorized__'} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.categoryName}
          </h2>
          <div className="flex flex-col gap-2">
            {group.habits.map((habit) => {
              const entry = entryFor(habit, selected);
              const Icon = HABIT_ICONS[habit.icon] ?? Star;
              const showStreak =
                habit.streak_mode !== 'none' && habit.current_streak > 0;
              const subtitle =
                habit.type === 'numeric' && entry?.numeric_value != null
                  ? `${entry.numeric_value}${habit.target_value != null ? `/${habit.target_value}` : ''}`
                  : undefined;
              return (
                <LogRow
                  key={habit.id}
                  icon={<Icon size={20} aria-hidden="true" />}
                  color={habit.color ?? '#6b7280'}
                  title={truncateName(habit.name)}
                  subtitle={subtitle}
                  badge={
                    showStreak ? (
                      <span
                        data-testid="streak-badge"
                        className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                      >
                        🔥 {habit.current_streak}
                      </span>
                    ) : undefined
                  }
                  value={rowValue(habit, entry)}
                  onSelectDone={() => selectDone(habit)}
                  onSelectNotDone={() => selectNotDone(habit)}
                  onRowClick={() => void navigate(`/habits/${habit.id}`)}
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Bottom sheet for numeric/text check-in */}
      {activeSheet && (
        <HabitSheet
          habit={activeSheet}
          date={selected}
          entry={entryFor(activeSheet, selected) ?? null}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
}
