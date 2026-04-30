import { getDatabase } from '../../data/database';

export type PrefKey =
  | 'onboarded_at'
  | 'theme'
  | 'biometric_enabled'
  | 'last_budget_id'
  | 'llm_model_downloaded'
  | 'llm_model_name'
  | 'llm_last_used_at';

export async function getPref(key: PrefKey): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM prefs WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setPref(key: PrefKey, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO prefs (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function deletePref(key: PrefKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM prefs WHERE key = ?', [key]);
}
