import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import {
  useEntryMutations,
  useFreezeMutations,
  useHabit,
  useHabitEntries,
  useHabitStreak,
  type Habit,
  type HabitEntry,
} from '@cockpit-app/habits-data-access';
import {
  HABIT_ICONS,
  HeatmapCalendar,
  LineBarChart,
  PageHeader,
  SegmentedControl,
  heatmapRange,
  toDateKey,
  type HeatmapState,
} from '@cockpit-app/habits-ui';
import { Badge, Button } from '@cockpit-app/shared-react-ui';
import { HabitSheet } from './HabitSheet';
import { HabitCreationSheet } from './HabitCreationSheet';

const TIME_RANGES = ['6M', '1Y'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

/** Heatmap columns (weeks) per period; drives cells shown, chart and entry list. */
const RANGE_WEEKS: Record<TimeRange, number> = {
  '6M': 26,
  '1Y': 52,
};

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

export function HabitDetailPage() {
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
      <PageHeader
        title={habit.name}
        description={habit.category_name ?? undefined}
        leading={
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: habit.color ?? '#3b82f6' }}
          >
            <IconComponent size={22} color="white" aria-hidden="true" />
          </div>
        }
        actions={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            className="rounded-full"
            aria-label="Edit habit"
          >
            <Pencil size={18} aria-hidden="true" />
          </Button>
        }
      />

      {/* Streak section */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border p-4">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{streak?.current_streak ?? habit.current_streak}</span>
          <span className="text-xs text-muted-foreground">Current streak</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{streak?.best_streak ?? habit.best_streak}</span>
          <span className="text-xs text-muted-foreground">Best streak</span>
        </div>
        <div className="flex flex-col items-center">
          <Badge
            className="rounded-full px-2 py-1 capitalize text-white"
            style={{ backgroundColor: habit.color ?? '#3b82f6' }}
          >
            {habit.streak_mode}
          </Badge>
          <span className="text-xs text-muted-foreground">Mode</span>
        </div>
      </div>

      {/* Freeze button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleApplyFreeze}
        disabled={createFreeze.isPending}
        className="h-auto rounded-xl py-3"
        aria-label={`Apply freeze — ${remainingFreezes} remaining this month`}
      >
        Apply Freeze
        <Badge variant="secondary" className="rounded-full font-bold">
          {remainingFreezes}
        </Badge>
        <span className="text-xs text-muted-foreground">remaining</span>
      </Button>

      <SegmentedControl
        options={TIME_RANGES}
        value={timeRange}
        onChange={setTimeRange}
        aria-label="Time range"
      />

      {/* Graph */}
      {entriesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <HeatmapCalendar
              entries={heatmapEntries}
              color={habit.color ?? '#3b82f6'}
              weeks={weeks}
              onCellClick={handleCellClick}
            />
          </div>
          {habit.type === 'numeric' && (
            <div className="rounded-xl border p-4">
              <LineBarChart
                data={chartData}
                targetValue={habit.target_value ?? undefined}
                color={habit.color ?? '#3b82f6'}
              />
            </div>
          )}
          {habit.type === 'text' && (
            <div className="flex flex-col gap-2 rounded-xl border p-4">
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
        <div className="flex flex-col gap-2 rounded-xl border p-4">
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
