export type Transaction = {
  id: string;
  merchant: string;
  amountMinor: number;
  currency: string;
  occurredOn: string;
  category: string;
  source: 'snap' | 'manual';
  receiptImageUri?: string | null;
  createdAt: string;
};

export type CreateTransactionInput = {
  merchant: string;
  amountMinor: number;
  currency: string;
  occurredOn: string;
  category: string;
  source: 'snap' | 'manual';
  receiptImageUri?: string | null;
};

export type UpdateTransactionInput = {
  merchant: string;
  amountMinor: number;
  currency: string;
  occurredOn: string;
  category: string;
};
