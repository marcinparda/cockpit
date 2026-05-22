import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { StreakResponseSchema, StreakResponse } from '../schemas';
import { STATS_ENDPOINTS } from '../endpoints';

export function useHabitStreak(habitId: string) {
  return useQuery<StreakResponse>({
    queryKey: ['habit', habitId, 'streak'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${STATS_ENDPOINTS.STREAK(habitId)}`,
        responseDataSchema: StreakResponseSchema,
      }),
    enabled: !!habitId,
  });
}
