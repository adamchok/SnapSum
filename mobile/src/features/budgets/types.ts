export type BudgetPeriod = 'monthly' | 'weekly';

export type Budget = {
  id: string;
  name: string;
  period: BudgetPeriod;
  currency: string;
  startOn: string | null;
  endOn: string | null;
  createdAt: string;
};

export type BudgetEnvelope = {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryName: string;
  limitMinor: number;
  rollover: boolean;
};

export type BudgetEnvelopeStatus = {
  envelope: BudgetEnvelope;
  spentMinor: number;
  remainingMinor: number;
  usagePct: number;
  isWarning: boolean;
  isOver: boolean;
};

export type CreateBudgetInput = {
  name: string;
  period: BudgetPeriod;
  currency: string;
  envelopes: Array<{
    categoryId: string;
    limitMinor: number;
  }>;
};
