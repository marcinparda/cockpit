import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStatsToday, useStatsWeekly, useStatsStreaks, useStatsMonthly } from '../api/hooks/useStats';

export default function StatsPage() {
  const { data: todayStats, isLoading: todayLoading } = useStatsToday();
  const { data: weeklyStats, isLoading: weeklyLoading } = useStatsWeekly();
  const { data: streaks, isLoading: streaksLoading } = useStatsStreaks();
  const { data: monthly } = useStatsMonthly();

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold">Stats</h1>

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-lg font-semibold mb-2">
          Today
        </h2>
        {todayLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div
            data-testid="today-completion"
            className="text-6xl font-bold text-primary"
          >
            {todayStats ? `${Math.round(todayStats.completion_pct)}%` : '—'}
          </div>
        )}
      </section>

      <section aria-labelledby="weekly-heading">
        <h2 id="weekly-heading" className="text-lg font-semibold mb-4">
          This Week
        </h2>
        {weeklyLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyStats ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [String(value), 'Completions']} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section aria-labelledby="streaks-heading">
        <h2 id="streaks-heading" className="text-lg font-semibold mb-4">
          Streak Ranking
        </h2>
        {streaksLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <ol className="space-y-2">
            {(streaks ?? [])
              .slice()
              .sort((a, b) => b.current_streak - a.current_streak)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="flex items-center gap-1 text-orange-500 font-semibold">
                    🔥 {item.current_streak}
                  </span>
                </li>
              ))}
            {(streaks ?? []).length === 0 && (
              <li className="text-muted-foreground text-sm">No streak data yet.</li>
            )}
          </ol>
        )}
      </section>

      {monthly && (
        <section aria-labelledby="highlights-heading">
          <h2 id="highlights-heading" className="text-lg font-semibold mb-4">
            Monthly Highlights
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {monthly.longest_streak_habit && (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="font-semibold">{monthly.longest_streak_habit}</p>
                <p className="text-2xl font-bold text-primary">
                  {monthly.longest_streak} days
                </p>
              </div>
            )}
            {monthly.most_consistent_habit && (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Most Consistent</p>
                <p className="font-semibold">{monthly.most_consistent_habit}</p>
                <p className="text-2xl font-bold text-primary">
                  {monthly.consistency_rate != null
                    ? `${Math.round(monthly.consistency_rate)}%`
                    : '—'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
