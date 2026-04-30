import { useQuery } from '@tanstack/react-query';
import {
  getCategorySpendForRange,
  getDailySpendForRange,
  getTransactionById,
  getTotalSpendMinorForRange,
  listTransactions,
} from './repository';
import { getCurrentMonthRange } from '../../lib/date';

export const transactionQueryKeys = {
  all: ['transactions'] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
  monthlyTotal: ['transactions', 'monthly-total'] as const,
  monthlyCategory: ['transactions', 'monthly-category'] as const,
  dailySpend: ['transactions', 'daily-spend'] as const,
};

export function useTransactionsQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.all,
    queryFn: () => listTransactions(),
  });
}

export function useMonthlySpendQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.monthlyTotal,
    queryFn: async () => {
      const range = getCurrentMonthRange();
      return getTotalSpendMinorForRange(range.startInclusive, range.endExclusive);
    },
  });
}

export function useMonthlyCategorySpendQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.monthlyCategory,
    queryFn: async () => {
      const range = getCurrentMonthRange();
      return getCategorySpendForRange(range.startInclusive, range.endExclusive);
    },
  });
}

export function useDailySpendQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.dailySpend,
    queryFn: async () => {
      const range = getCurrentMonthRange();
      return getDailySpendForRange(range.startInclusive, range.endExclusive);
    },
  });
}

export function useTransactionDetailQuery(id: string) {
  return useQuery({
    queryKey: transactionQueryKeys.detail(id),
    queryFn: () => getTransactionById(id),
    enabled: Boolean(id),
  });
}
