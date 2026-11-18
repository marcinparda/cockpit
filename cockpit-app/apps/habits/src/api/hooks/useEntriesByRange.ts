import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitEntrySchema, HabitEntry } from '../schemas';
import { ENTRIES_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

const EntryListSchema = z.array(HabitEntrySchema);

/**
 * All entries across habits in [startDate, endDate]. The key is prefixed with
 * 'habits' so entry mutations invalidating ['habits'] refresh it.
 */
export function useEntriesByRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  return useQuery<HabitEntry[]>({
    queryKey: ['habits', 'entries', startDate, endDate],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${ENTRIES_ENDPOINTS.ALL_BY_RANGE}?${params.toString()}`,
        responseDataSchema: EntryListSchema,
      }),
  });
}
