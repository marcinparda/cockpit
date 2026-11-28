import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { z } from 'zod';

const FreezeResponseSchema = z.object({
  id: z.string().uuid(),
  habit_id: z.string().uuid(),
  user_id: z.string().uuid(),
  freeze_date: z.string(),
});

interface CreateFreezePayload {
  habitId: string;
  freeze_date: string;
}

export function useFreezeMutations() {
  const queryClient = useQueryClient();
  // No list-freezes endpoint exists yet, so this only counts freezes applied
  // in this session; the API remains the source of truth for the monthly limit.
  const [freezesThisMonth, setFreezesThisMonth] = useState(0);

  const createFreeze = useMutation({
    mutationFn: ({ habitId, freeze_date }: CreateFreezePayload) =>
      fetcher({
        url: `${environments.apiUrl}/api/v1/habits/${habitId}/freezes?freeze_date=${freeze_date}`,
        responseDataSchema: FreezeResponseSchema,
        options: {
          method: 'POST',
        },
      }),
    onSuccess: (_data, variables) => {
      setFreezesThisMonth((n) => n + 1);
      void queryClient.invalidateQueries({
        queryKey: ['habit', variables.habitId],
      });
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  return { createFreeze, freezesThisMonth };
}
