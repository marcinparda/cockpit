import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';
import { HabitCategorySchema, HabitCategory } from '../schemas';
import { CATEGORIES_ENDPOINTS } from '../endpoints';
import { z } from 'zod';

const HabitCategoryListSchema = HabitCategorySchema.array();

export function useCategories() {
  return useQuery<HabitCategory[]>({
    queryKey: ['categories'],
    queryFn: () =>
      fetcher({
        url: `${environments.apiUrl}${CATEGORIES_ENDPOINTS.LIST}`,
        responseDataSchema: HabitCategoryListSchema,
      }),
  });
}

interface CreateCategoryPayload {
  name: string;
  color?: string;
}

interface UpdateCategoryPayload {
  id: string;
  name?: string;
  color?: string;
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createCategory = useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      fetcher({
        url: `${environments.apiUrl}${CATEGORIES_ENDPOINTS.CREATE}`,
        responseDataSchema: HabitCategorySchema,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, ...body }: UpdateCategoryPayload) =>
      fetcher({
        url: `${environments.apiUrl}${CATEGORIES_ENDPOINTS.UPDATE(id)}`,
        responseDataSchema: HabitCategorySchema,
        options: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      }),
    onSuccess: () => void invalidate(),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      fetcher({
        url: `${environments.apiUrl}${CATEGORIES_ENDPOINTS.DELETE(id)}`,
        responseDataSchema: z.undefined(),
        options: { method: 'DELETE' },
      }),
    onSuccess: () => void invalidate(),
  });

  return { createCategory, updateCategory, deleteCategory };
}
