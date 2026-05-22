import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitSchema, Habit } from '../schemas';
import { HABITS_ENDPOINTS } from '../endpoints';

export function useHabitDetail(id: string) {
  return useQuery<Habit>({
    queryKey: ['habit', id],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.DETAIL(id)}`,
        responseDataSchema: HabitSchema,
      }),
    enabled: !!id,
  });
}
