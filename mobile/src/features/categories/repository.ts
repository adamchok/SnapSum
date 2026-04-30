import { getDatabase } from '../../data/database';
import { Category } from './types';

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  system: number;
  created_at: string;
};

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    system: row.system === 1,
    createdAt: row.created_at,
  };
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT id, name, icon, color, system, created_at FROM categories ORDER BY system DESC, name ASC',
  );
  return rows.map(toCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT id, name, icon, color, system, created_at FROM categories WHERE id = ?',
    [id],
  );
  return row ? toCategory(row) : null;
}

export async function getCategoryByName(name: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT id, name, icon, color, system, created_at FROM categories WHERE name = ? COLLATE NOCASE',
    [name],
  );
  return row ? toCategory(row) : null;
}

export async function createCategory(input: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<Category> {
  const db = await getDatabase();
  const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, system, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    [id, input.name.trim(), input.icon ?? 'tag', input.color ?? '#3FB08A', now],
  );

  return {
    id,
    name: input.name.trim(),
    icon: input.icon ?? 'tag',
    color: input.color ?? '#3FB08A',
    system: false,
    createdAt: now,
  };
}

export async function deleteCategoryById(id: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM categories WHERE id = ? AND system = 0',
    [id],
  );
  if (result.changes < 1) {
    throw new Error('Cannot delete system categories.');
  }
}
