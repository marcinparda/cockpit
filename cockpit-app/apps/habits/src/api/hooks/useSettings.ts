import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { UserHabitSettingsSchema, UserHabitSettings } from '../schemas';
import { SETTINGS_ENDPOINTS } from '../endpoints';

interface UpdateSettingsPayload {
  notifications_enabled?: boolean;
  push_subscription?: Record<string, unknown> | null;
}

export function useSettings() {
  return useQuery<UserHabitSettings>({
    queryKey: ['settings'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${SETTINGS_ENDPOINTS.GET}`,
        responseDataSchema: UserHabitSettingsSchema,
      }),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      fetcher({
        url: `${environments.apiUrl}${SETTINGS_ENDPOINTS.UPDATE}`,
        responseDataSchema: UserHabitSettingsSchema,
        options: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
