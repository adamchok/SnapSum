import { getDatabase } from '../../data/database';
import { CreateTransactionInput, Transaction, UpdateTransactionInput } from './types';
import {
  isValidCurrencyCode,
  isValidISODate,
  normalizeCurrencyCode,
  sanitizeText,
} from '../../lib/validation';

type CategorySpendRow = {
  category: string;
  totalMinor: number;
};

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const validated = validateCreateInput(input);
  const db = await getDatabase();
  const id = createId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (
      id, merchant, amount_minor, currency, occurred_on, category, source, receipt_image_uri, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      validated.merchant,
      validated.amountMinor,
      validated.currency,
      validated.occurredOn,
      validated.category,
      validated.source,
      validated.receiptImageUri ?? null,
      createdAt,
    ],
  );

  return {
    id,
    merchant: validated.merchant,
    amountMinor: validated.amountMinor,
    currency: validated.currency,
    occurredOn: validated.occurredOn,
    category: validated.category,
    source: validated.source,
    receiptImageUri: validated.receiptImageUri ?? null,
    createdAt,
  };
}

export async function listTransactions(limit = 200): Promise<Transaction[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    merchant: string;
    amount_minor: number;
    currency: string;
    occurred_on: string;
    category: string;
    source: 'snap' | 'manual';
    receipt_image_uri: string | null;
    created_at: string;
  }>(
    `SELECT id, merchant, amount_minor, currency, occurred_on, category, source, receipt_image_uri, created_at
     FROM transactions
     ORDER BY occurred_on DESC, created_at DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    merchant: row.merchant,
    amountMinor: row.amount_minor,
    currency: row.currency,
    occurredOn: row.occurred_on,
    category: row.category,
    source: row.source,
    receiptImageUri: row.receipt_image_uri,
    createdAt: row.created_at,
  }));
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    merchant: string;
    amount_minor: number;
    currency: string;
    occurred_on: string;
    category: string;
    source: 'snap' | 'manual';
    receipt_image_uri: string | null;
    created_at: string;
  }>(
    `SELECT id, merchant, amount_minor, currency, occurred_on, category, source, receipt_image_uri, created_at
     FROM transactions
     WHERE id = ?`,
    [id],
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    merchant: row.merchant,
    amountMinor: row.amount_minor,
    currency: row.currency,
    occurredOn: row.occurred_on,
    category: row.category,
    source: row.source,
    receiptImageUri: row.receipt_image_uri,
    createdAt: row.created_at,
  };
}

export async function updateTransactionById(
  id: string,
  input: UpdateTransactionInput,
): Promise<void> {
  const validated = validateUpdateInput(input);
  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE transactions
     SET merchant = ?, amount_minor = ?, currency = ?, occurred_on = ?, category = ?
     WHERE id = ?`,
    [
      validated.merchant,
      validated.amountMinor,
      validated.currency,
      validated.occurredOn,
      validated.category,
      id,
    ],
  );

  if (result.changes < 1) {
    throw new Error('Transaction not found.');
  }
}

export async function deleteTransactionById(id: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
  if (result.changes < 1) {
    throw new Error('Transaction not found.');
  }
}

export async function getTotalSpendMinorForRange(
  startInclusive: string,
  endExclusive: string,
): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ totalMinor: number }>(
    `SELECT COALESCE(SUM(amount_minor), 0) as totalMinor
     FROM transactions
     WHERE occurred_on >= ? AND occurred_on < ?`,
    [startInclusive, endExclusive],
  );

  return row?.totalMinor ?? 0;
}

export async function getCategorySpendForRange(
  startInclusive: string,
  endExclusive: string,
): Promise<CategorySpendRow[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<CategorySpendRow>(
    `SELECT category, COALESCE(SUM(amount_minor), 0) AS totalMinor
     FROM transactions
     WHERE occurred_on >= ? AND occurred_on < ?
     GROUP BY category`,
    [startInclusive, endExclusive],
  );

  return rows;
}

export async function getDailySpendForRange(
  startInclusive: string,
  endExclusive: string,
): Promise<Array<{ day: string; totalMinor: number }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string; totalMinor: number }>(
    `SELECT occurred_on AS day, COALESCE(SUM(amount_minor), 0) AS totalMinor
     FROM transactions
     WHERE occurred_on >= ? AND occurred_on < ?
     GROUP BY occurred_on
     ORDER BY occurred_on ASC`,
    [startInclusive, endExclusive],
  );
  return rows;
}

function createId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `tx_${Date.now()}_${rand}`;
}

function validateCreateInput(input: CreateTransactionInput): CreateTransactionInput {
  const merchant = sanitizeText(input.merchant);
  const category = sanitizeText(input.category);
  const currency = normalizeCurrencyCode(input.currency);
  const occurredOn = input.occurredOn.trim();

  if (!merchant) {
    throw new Error('Merchant is required.');
  }
  if (!category) {
    throw new Error('Category is required.');
  }
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error('Amount must be positive and in minor units.');
  }
  if (!isValidCurrencyCode(currency)) {
    throw new Error('Currency must be a 3-letter ISO code.');
  }
  if (!isValidISODate(occurredOn)) {
    throw new Error('Date must be in YYYY-MM-DD format.');
  }

  return {
    ...input,
    merchant,
    category,
    currency,
    occurredOn,
  };
}

function validateUpdateInput(input: UpdateTransactionInput): UpdateTransactionInput {
  const merchant = sanitizeText(input.merchant);
  const category = sanitizeText(input.category);
  const currency = normalizeCurrencyCode(input.currency);
  const occurredOn = input.occurredOn.trim();

  if (!merchant) {
    throw new Error('Merchant is required.');
  }
  if (!category) {
    throw new Error('Category is required.');
  }
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error('Amount must be positive and in minor units.');
  }
  if (!isValidCurrencyCode(currency)) {
    throw new Error('Currency must be a 3-letter ISO code.');
  }
  if (!isValidISODate(occurredOn)) {
    throw new Error('Date must be in YYYY-MM-DD format.');
  }

  return {
    ...input,
    merchant,
    category,
    currency,
    occurredOn,
  };
}
