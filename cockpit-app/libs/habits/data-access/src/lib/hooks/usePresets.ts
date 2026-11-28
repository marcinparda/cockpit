import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { PresetHabitSchema, PresetHabit } from '../schemas';
import { PRESETS_ENDPOINTS } from '../endpoints';

const PresetHabitListSchema = PresetHabitSchema.array();

export function usePresets() {
  return useQuery<PresetHabit[]>({
    queryKey: ['presets'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${PRESETS_ENDPOINTS.LIST}`,
        responseDataSchema: PresetHabitListSchema,
      }),
  });
}
