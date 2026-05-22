import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitSchema, Habit } from '../schemas';
import { HABITS_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

const HabitListSchema = HabitSchema.array();

export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.LIST}`,
        responseDataSchema: HabitListSchema,
      }),
  });
}

export function useHabit(id: string) {
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
