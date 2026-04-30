import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCategories, createCategory } from './repository';

export const categoryQueryKeys = {
  all: ['categories'] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryQueryKeys.all,
    queryFn: listCategories,
    staleTime: Infinity,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; icon?: string; color?: string }) =>
      createCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}
