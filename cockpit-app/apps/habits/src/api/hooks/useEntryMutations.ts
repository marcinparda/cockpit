import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitEntrySchema } from '../schemas';
import { ENTRIES_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

interface UpsertEntryPayload {
  habitId: string;
  logged_at: string;
  boolean_value?: boolean | null;
  numeric_value?: number | null;
  numeric_unit?: string | null;
  text_value?: string | null;
}

interface DeleteEntryPayload {
  habitId: string;
  entryId: string;
}

export function useEntryMutations() {
  const queryClient = useQueryClient();

  const upsertEntry = useMutation({
    mutationFn: ({ habitId, ...body }: UpsertEntryPayload) =>
      fetcher({
        url: `${environments.apiUrl}${ENTRIES_ENDPOINTS.UPSERT(habitId)}`,
        responseDataSchema: HabitEntrySchema,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({
        queryKey: ['habit', variables.habitId],
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: ({ habitId, entryId }: DeleteEntryPayload) =>
      fetcher({
        url: `${environments.apiUrl}${ENTRIES_ENDPOINTS.DELETE_ENTRY(habitId, entryId)}`,
        responseDataSchema: z.undefined(),
        options: { method: 'DELETE' },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({
        queryKey: ['habit', variables.habitId],
      });
    },
  });

  return { upsertEntry, deleteEntry };
}
