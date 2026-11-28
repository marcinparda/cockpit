import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitSchema, Habit } from '../schemas';
import { HABITS_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

interface CreateHabitPayload {
  name: string;
  type: Habit['type'];
  icon?: string;
  color?: string;
  category_id?: string | null;
  frequency?: string;
  target_value?: number;
  unit?: string;
  streak_mode?: Habit['streak_mode'];
  description?: string;
}

interface UpdateHabitPayload extends Partial<CreateHabitPayload> {
  id: string;
  is_archived?: boolean;
  sort_order?: number;
}

export function useHabitMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['habits'] });

  const createHabit = useMutation({
    mutationFn: (payload: CreateHabitPayload) =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.CREATE}`,
        responseDataSchema: HabitSchema,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  const updateHabit = useMutation({
    mutationFn: ({ id, ...body }: UpdateHabitPayload) =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.UPDATE(id)}`,
        responseDataSchema: HabitSchema,
        options: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.DELETE(id)}`,
        responseDataSchema: z.undefined(),
        options: { method: 'DELETE' },
      }),
    onSuccess: () => void invalidate(),
  });

  const archiveHabit = useMutation({
    mutationFn: ({ id, is_archived }: { id: string; is_archived: boolean }) =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.UPDATE(id)}`,
        responseDataSchema: HabitSchema,
        options: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived }),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  const updateSortOrder = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      fetcher({
        url: `${environments.apiUrl}${HABITS_ENDPOINTS.UPDATE(id)}`,
        responseDataSchema: HabitSchema,
        options: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order }),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  return { createHabit, updateHabit, deleteHabit, archiveHabit, updateSortOrder };
}
