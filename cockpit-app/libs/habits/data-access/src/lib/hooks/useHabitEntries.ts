import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitEntrySchema, HabitEntry } from '../schemas';
import { ENTRIES_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

interface DateRange {
  startDate: string;
  endDate: string;
}

const HabitEntryListSchema = z.array(HabitEntrySchema);

export function useHabitEntries(habitId: string, dateRange: DateRange) {
  const params = new URLSearchParams({
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  return useQuery<HabitEntry[]>({
    queryKey: ['habit', habitId, 'entries', dateRange],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${ENTRIES_ENDPOINTS.BY_HABIT(habitId)}?${params.toString()}`,
        responseDataSchema: HabitEntryListSchema,
      }),
    enabled: !!habitId,
  });
}
