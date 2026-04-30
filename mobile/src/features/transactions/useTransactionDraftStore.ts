import { create } from 'zustand';

export type TransactionDraft = {
  merchant: string;
  amount: string;
  currency: string;
  occurredOn: string;
  category: string;
};

type DraftStore = {
  draft: TransactionDraft;
  setDraft: (patch: Partial<TransactionDraft>) => void;
  clearDraft: () => void;
};

const initialDraft: TransactionDraft = {
  merchant: '',
  amount: '',
  currency: 'MYR',
  occurredOn: new Date().toISOString().slice(0, 10),
  category: '',
};

export const useTransactionDraftStore = create<DraftStore>((set) => ({
  draft: initialDraft,
  setDraft: (patch) =>
    set((state) => ({
      draft: { ...state.draft, ...patch },
    })),
  clearDraft: () => set({ draft: initialDraft }),
}));
