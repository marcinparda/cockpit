import { useState, useMemo, useEffect } from 'react';
import { Habit } from '../api/schemas';
import { useHabits } from '../api/hooks/useHabits';
import { HabitTile } from '../components/HabitTile';
import { HabitSheet } from '../components/HabitSheet';
import { ConfettiAnimation } from '../components/ConfettiAnimation';

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function isCompletedToday(habit: Habit, todayKey: string): boolean {
  const entry = habit.today_entry;
  if (!entry) return false;
  if (entry.logged_at !== todayKey) return false;
  if (habit.type === 'boolean') return entry.boolean_value === true;
  if (habit.type === 'numeric') {
    if (entry.numeric_value == null) return false;
    if (habit.target_value != null) return entry.numeric_value >= habit.target_value;
    return true; // no target set: any logged value counts
  }
  if (habit.type === 'text') return !!entry.text_value?.trim();
  return false;
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
  const { data: habits, isLoading } = useHabits();
  const [activeSheet, setActiveSheet] = useState<Habit | null>(null);
  const [confettiShown, setConfettiShown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const todayKey = getTodayKey();

  const activeHabits = useMemo(
    () => (habits ?? []).filter((h) => h.is_active && !h.is_archived),
    [habits],
  );

  const completedCount = useMemo(
    () => activeHabits.filter((h) => isCompletedToday(h, todayKey)).length,
    [activeHabits, todayKey],
  );

  const allDone = activeHabits.length > 0 && completedCount === activeHabits.length;

  // Trigger confetti once when all habits are done
  useEffect(() => {
    if (allDone && !confettiShown) {
      setShowConfetti(true);
      setConfettiShown(true);
    }
  }, [allDone, confettiShown]);

  const groups = useMemo(() => groupByCategory(activeHabits), [activeHabits]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground">Loading habits...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {showConfetti && (
        <ConfettiAnimation onDone={() => setShowConfetti(false)} />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background pb-2 pt-0">
        <p className="text-sm text-muted-foreground">{formatToday()}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Today</h1>
          {activeHabits.length > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount}/{activeHabits.length}
            </span>
          )}
        </div>
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
            All done for today!
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">
            Great work keeping your streak alive.
          </p>
        </div>
      )}

      {/* Habit grid grouped by category */}
      {groups.map((group) => (
        <section key={group.categoryId ?? '__uncategorized__'} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.categoryName}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {group.habits.map((habit) => {
              const completed = isCompletedToday(habit, todayKey);
              return (
                <HabitTile
                  key={habit.id}
                  habit={habit}
                  completed={completed}
                  todayEntry={habit.today_entry ?? null}
                  onOpenSheet={setActiveSheet}
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
          todayEntry={activeSheet.today_entry ?? null}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
}
