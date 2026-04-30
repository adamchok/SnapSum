import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

const CURRENT_VERSION = 2;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('snapsum.db');

  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await migrateV1(db);
  }
  if (version < 2) {
    await migrateV2(db);
  }

  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION};`);
  return db;
}

async function migrateV1(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      merchant TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      occurred_on TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      receipt_image_uri TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_occurred_on
      ON transactions (occurred_on DESC);

    CREATE INDEX IF NOT EXISTS idx_transactions_category
      ON transactions (category);
  `);
}

async function migrateV2(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'tag',
      color TEXT NOT NULL DEFAULT '#3FB08A',
      system INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      currency TEXT NOT NULL DEFAULT 'MYR',
      start_on TEXT,
      end_on TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_envelopes (
      id TEXT PRIMARY KEY NOT NULL,
      budget_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      limit_minor INTEGER NOT NULL,
      rollover INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      image_local_path TEXT,
      parsed_json TEXT,
      model_version TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prefs (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_budget_envelopes_budget
      ON budget_envelopes (budget_id);

    CREATE INDEX IF NOT EXISTS idx_receipts_transaction
      ON receipts (transaction_id);

    CREATE INDEX IF NOT EXISTS idx_line_items_transaction
      ON line_items (transaction_id);
  `);

  await seedSystemCategories(db);
}

const SYSTEM_CATEGORIES = [
  { id: 'cat_food_drink', name: 'Food & Drink', icon: 'coffee', color: '#E67E22' },
  { id: 'cat_groceries', name: 'Groceries', icon: 'shopping-cart', color: '#27AE60' },
  { id: 'cat_transport', name: 'Transport', icon: 'car', color: '#3498DB' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9B59B6' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'film', color: '#E74C3C' },
  { id: 'cat_health', name: 'Health', icon: 'heart', color: '#1ABC9C' },
  { id: 'cat_education', name: 'Education', icon: 'book-open', color: '#F39C12' },
  { id: 'cat_utilities', name: 'Utilities', icon: 'zap', color: '#2C3E50' },
  { id: 'cat_personal', name: 'Personal', icon: 'user', color: '#8E44AD' },
  { id: 'cat_misc', name: 'Miscellaneous', icon: 'tag', color: '#7F8C8D' },
] as const;

async function seedSystemCategories(db: SQLite.SQLiteDatabase) {
  const now = new Date().toISOString();
  for (const cat of SYSTEM_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, system, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, now],
    );
  }
}
