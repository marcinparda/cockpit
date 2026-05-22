import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { z } from 'zod';
import { HabitSchema } from '../schemas';

const TodayStatsSchema = z.object({
  completed: z.number(),
  total: z.number(),
  completion_pct: z.number(),
});

const WeeklyStatItemSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const WeeklyStatsSchema = WeeklyStatItemSchema.array();

const StreakRankingSchema = HabitSchema.array();

const MonthlyHighlightsSchema = z.object({
  longest_streak_habit: z.string().nullable().optional(),
  longest_streak: z.number().optional(),
  most_consistent_habit: z.string().nullable().optional(),
  consistency_rate: z.number().optional(),
});

export type TodayStats = z.infer<typeof TodayStatsSchema>;
export type WeeklyStatItem = z.infer<typeof WeeklyStatItemSchema>;
export type MonthlyHighlights = z.infer<typeof MonthlyHighlightsSchema>;

export function useStatsToday() {
  return useQuery<TodayStats>({
    queryKey: ['stats', 'today'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}/api/v1/habits/stats/today`,
        responseDataSchema: TodayStatsSchema,
      }),
  });
}

export function useStatsWeekly() {
  return useQuery<WeeklyStatItem[]>({
    queryKey: ['stats', 'weekly'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}/api/v1/habits/stats/weekly`,
        responseDataSchema: WeeklyStatsSchema,
      }),
  });
}

export function useStatsStreaks() {
  return useQuery({
    queryKey: ['stats', 'streaks'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}/api/v1/habits/stats/streaks`,
        responseDataSchema: StreakRankingSchema,
      }),
  });
}

export function useStatsMonthly() {
  return useQuery<MonthlyHighlights | null>({
    queryKey: ['stats', 'monthly'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}/api/v1/habits/stats/monthly-highlights`,
        responseDataSchema: MonthlyHighlightsSchema,
      }),
  });
}
