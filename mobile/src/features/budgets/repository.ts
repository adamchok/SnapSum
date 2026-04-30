import { getDatabase } from '../../data/database';
import { Budget, BudgetEnvelope, CreateBudgetInput } from './types';

export async function listBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    period: string;
    currency: string;
    start_on: string | null;
    end_on: string | null;
    created_at: string;
  }>('SELECT id, name, period, currency, start_on, end_on, created_at FROM budgets ORDER BY created_at DESC');

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    period: r.period as Budget['period'],
    currency: r.currency,
    startOn: r.start_on,
    endOn: r.end_on,
    createdAt: r.created_at,
  }));
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    period: string;
    currency: string;
    start_on: string | null;
    end_on: string | null;
    created_at: string;
  }>('SELECT id, name, period, currency, start_on, end_on, created_at FROM budgets WHERE id = ?', [id]);

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    period: row.period as Budget['period'],
    currency: row.currency,
    startOn: row.start_on,
    endOn: row.end_on,
    createdAt: row.created_at,
  };
}

export async function getEnvelopesForBudget(budgetId: string): Promise<BudgetEnvelope[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    budget_id: string;
    category_id: string;
    limit_minor: number;
    rollover: number;
    category_name: string;
  }>(
    `SELECT be.id, be.budget_id, be.category_id, be.limit_minor, be.rollover,
            c.name as category_name
     FROM budget_envelopes be
     JOIN categories c ON c.id = be.category_id
     WHERE be.budget_id = ?
     ORDER BY c.name ASC`,
    [budgetId],
  );

  return rows.map((r) => ({
    id: r.id,
    budgetId: r.budget_id,
    categoryId: r.category_id,
    categoryName: r.category_name,
    limitMinor: r.limit_minor,
    rollover: r.rollover === 1,
  }));
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const db = await getDatabase();
  const budgetId = `budget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO budgets (id, name, period, currency, created_at) VALUES (?, ?, ?, ?, ?)',
    [budgetId, input.name.trim(), input.period, input.currency, now],
  );

  for (let i = 0; i < input.envelopes.length; i++) {
    const env = input.envelopes[i];
    const envId = `env_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      'INSERT INTO budget_envelopes (id, budget_id, category_id, limit_minor, rollover) VALUES (?, ?, ?, ?, 0)',
      [envId, budgetId, env.categoryId, env.limitMinor],
    );
  }

  return {
    id: budgetId,
    name: input.name.trim(),
    period: input.period,
    currency: input.currency,
    startOn: null,
    endOn: null,
    createdAt: now,
  };
}

export async function deleteBudgetById(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budget_envelopes WHERE budget_id = ?', [id]);
  const result = await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
  if (result.changes < 1) {
    throw new Error('Budget not found.');
  }
}
