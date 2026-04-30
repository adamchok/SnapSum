import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBudgets,
  getBudgetById,
  getEnvelopesForBudget,
  createBudget,
  deleteBudgetById,
} from './repository';
import { CreateBudgetInput } from './types';

export const budgetQueryKeys = {
  all: ['budgets'] as const,
  detail: (id: string) => ['budgets', 'detail', id] as const,
  envelopes: (budgetId: string) => ['budgets', 'envelopes', budgetId] as const,
};

export function useBudgetsQuery() {
  return useQuery({
    queryKey: budgetQueryKeys.all,
    queryFn: listBudgets,
  });
}

export function useBudgetDetailQuery(id: string) {
  return useQuery({
    queryKey: budgetQueryKeys.detail(id),
    queryFn: () => getBudgetById(id),
    enabled: Boolean(id),
  });
}

export function useEnvelopesQuery(budgetId: string) {
  return useQuery({
    queryKey: budgetQueryKeys.envelopes(budgetId),
    queryFn: () => getEnvelopesForBudget(budgetId),
    enabled: Boolean(budgetId),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudget(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetQueryKeys.all });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudgetById(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: budgetQueryKeys.all });
      qc.invalidateQueries({ queryKey: budgetQueryKeys.detail(id) });
      qc.invalidateQueries({ queryKey: budgetQueryKeys.envelopes(id) });
    },
  });
}
