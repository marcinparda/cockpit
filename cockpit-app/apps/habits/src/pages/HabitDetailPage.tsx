import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useHabit } from '../api/hooks/useHabits';
import { useHabitEntries } from '../api/hooks/useHabitEntries';
import { useHabitStreak } from '../api/hooks/useHabitStreak';
import { useFreezeMutations } from '../api/hooks/useFreezeMutations';
import { HeatmapCalendar, heatmapRange, type HeatmapState } from '../components/HeatmapCalendar';
import { HabitSheet } from '../components/HabitSheet';
import { useEntryMutations } from '../api/hooks/useEntryMutations';
import { toDateKey } from '../utils/date';
import { LineBarChart } from '../components/LineBarChart';
import { HabitCreationSheet } from '../components/HabitCreationSheet';
import { HABIT_ICONS } from '../icons';
import type { Habit, HabitEntry } from '../api/schemas';

type TimeRange = '6M' | '1Y' | '2Y' | '3Y' | '6Y';

/** Heatmap columns (weeks) per period; drives cells shown, chart and entry list. */
const RANGE_WEEKS: Record<TimeRange, number> = {
  '6M': 26,
  '1Y': 52,
  '2Y': 104,
  '3Y': 156,
  '6Y': 312,
};
const TIME_RANGES = Object.keys(RANGE_WEEKS) as TimeRange[];

const MAX_FREEZES_PER_MONTH = 2;

function heatmapState(habit: Habit, entry: HabitEntry): HeatmapState {
  if (entry.boolean_value === false) return 'notDone';
  if (habit.type === 'boolean') return entry.boolean_value === true ? 'done' : 'unlogged';
  if (habit.type === 'numeric') {
    if (entry.numeric_value == null) return 'unlogged';
    if (habit.target_value != null && entry.numeric_value < habit.target_value) return 'unlogged';
    return 'done';
  }
  return entry.text_value?.trim() ? 'done' : 'unlogged';
}

function buildHeatmapEntries(habit: Habit, entries: HabitEntry[]): Record<string, HeatmapState> {
  const map: Record<string, HeatmapState> = {};
  for (const entry of entries) {
    map[entry.logged_at] = heatmapState(habit, entry);
  }
  return map;
}

function buildChartData(entries: HabitEntry[]) {
  const sorted = [...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  return sorted.map((entry, idx) => {
    const windowStart = Math.max(0, idx - 6);
    const window = sorted.slice(windowStart, idx + 1);
    const sum = window.reduce((acc, e) => acc + (e.numeric_value ?? 0), 0);
    return {
      date: entry.logged_at.slice(5), // MM-DD
      value: entry.numeric_value ?? null,
      avg: Math.round((sum / window.length) * 10) / 10,
    };
  });
}

function entryDisplay(entry: HabitEntry): string {
  if (entry.boolean_value != null) return entry.boolean_value ? '✓' : '✗';
  if (entry.numeric_value != null) return String(entry.numeric_value);
  if (entry.text_value) return entry.text_value.slice(0, 60);
  return '—';
}

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [editOpen, setEditOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  const habitId = id ?? '';
  const weeks = RANGE_WEEKS[timeRange];
  const dateRange = heatmapRange(weeks);

  const { data: habit, isLoading: habitLoading } = useHabit(habitId);
  const { data: entries = [], isLoading: entriesLoading } = useHabitEntries(habitId, dateRange);
  const { upsertEntry, deleteEntry } = useEntryMutations();
  const { data: streak } = useHabitStreak(habitId);
  const { createFreeze, freezesThisMonth } = useFreezeMutations();

  const remainingFreezes = MAX_FREEZES_PER_MONTH - freezesThisMonth;

  if (habitLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Habit not found</p>
      </div>
    );
  }

  const IconComponent = HABIT_ICONS[habit.icon] ?? HABIT_ICONS['Star'];
  const heatmapEntries = buildHeatmapEntries(habit, entries);
  const chartData = buildChartData(entries);

  function handleCellClick(date: string, state: HeatmapState) {
    if (habit!.type !== 'boolean') {
      setSheetDate(date);
      return;
    }
    // unlogged -> done -> not done -> unlogged
    if (state === 'unlogged') {
      upsertEntry.mutate({ habitId: habit!.id, logged_at: date, boolean_value: true });
    } else if (state === 'done') {
      upsertEntry.mutate({ habitId: habit!.id, logged_at: date, boolean_value: false });
    } else {
      const entry = entries.find((e) => e.logged_at === date);
      if (entry) deleteEntry.mutate({ habitId: habit!.id, entryId: entry.id });
    }
  }

  function handleApplyFreeze() {
    const today = toDateKey(new Date());
    createFreeze.mutate({ habitId: habit!.id, freeze_date: today });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: habit.color ?? '#3b82f6' }}
          >
            <IconComponent size={22} color="white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{habit.name}</h1>
            {habit.category_name && (
              <p className="text-sm text-muted-foreground">{habit.category_name}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Edit habit"
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Streak section */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border p-4 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{streak?.current_streak ?? habit.current_streak}</span>
          <span className="text-xs text-muted-foreground">Current streak</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{streak?.best_streak ?? habit.best_streak}</span>
          <span className="text-xs text-muted-foreground">Best streak</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="rounded-full px-2 py-1 text-xs font-medium capitalize"
            style={{ backgroundColor: habit.color ?? '#3b82f6', color: 'white' }}
          >
            {habit.streak_mode}
          </span>
          <span className="text-xs text-muted-foreground">Mode</span>
        </div>
      </div>

      {/* Freeze button */}
      <button
        type="button"
        onClick={handleApplyFreeze}
        disabled={createFreeze.isPending}
        className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label={`Apply freeze — ${remainingFreezes} remaining this month`}
      >
        Apply Freeze
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {remainingFreezes}
        </span>
        <span className="text-xs text-muted-foreground">remaining</span>
      </button>

      {/* Time range selector */}
      <div role="group" aria-label="Time range" className="flex gap-1.5">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setTimeRange(range)}
            aria-pressed={timeRange === range}
            className={`flex-1 rounded-lg py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'border hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Graph */}
      {entriesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4 dark:border-gray-700">
            <HeatmapCalendar
              entries={heatmapEntries}
              color={habit.color ?? '#3b82f6'}
              weeks={weeks}
              onCellClick={handleCellClick}
            />
          </div>
          {habit.type === 'numeric' && (
            <div className="rounded-xl border p-4 dark:border-gray-700">
              <LineBarChart
                data={chartData}
                targetValue={habit.target_value ?? undefined}
                color={habit.color ?? '#3b82f6'}
              />
            </div>
          )}
          {habit.type === 'text' && (
            <div className="flex flex-col gap-2 rounded-xl border p-4 dark:border-gray-700">
              <h2 className="text-sm font-semibold">Journal entries</h2>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet</p>
              ) : (
                [...entries]
                  .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
                  .slice(0, 20)
                  .map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-sm">
                      <span className="w-24 shrink-0 text-muted-foreground">{entry.logged_at}</span>
                      <span>{entry.text_value ?? '—'}</span>
                    </div>
                  ))
              )}
            </div>
          )}
        </>
      )}

      {/* Entry log (boolean/numeric habits) */}
      {habit.type !== 'text' && (
        <div className="flex flex-col gap-2 rounded-xl border p-4 dark:border-gray-700">
          <h2 className="text-sm font-semibold">Recent entries</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet</p>
          ) : (
            [...entries]
              .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
              .slice(0, 10)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{entry.logged_at}</span>
                  <span className="font-medium">{entryDisplay(entry)}</span>
                </div>
              ))
          )}
        </div>
      )}

      {/* Past-day check-in sheet (numeric/text) */}
      {sheetDate && (
        <HabitSheet
          habit={habit}
          date={sheetDate}
          entry={entries.find((e) => e.logged_at === sheetDate) ?? null}
          onClose={() => setSheetDate(null)}
        />
      )}

      {/* Edit sheet */}
      {editOpen && (
        <HabitCreationSheet
          onClose={() => setEditOpen(false)}
          editHabit={habit}
        />
      )}
    </div>
  );
}
