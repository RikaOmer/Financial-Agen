import type { SQLiteDatabase } from 'expo-sqlite';

export async function getSetting(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
}

export async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export async function getMonthlyTarget(db: SQLiteDatabase): Promise<number> {
  const value = await getSetting(db, 'monthly_leisure_target');
  return value ? parseFloat(value) : 0;
}

export async function getBaselineAvg(db: SQLiteDatabase): Promise<number> {
  const value = await getSetting(db, 'baseline_avg');
  return value ? parseFloat(value) : 0;
}

export async function getSavingsGoal(db: SQLiteDatabase): Promise<{ name: string; amount: number } | null> {
  const name = await getSetting(db, 'savings_goal_name');
  const amount = await getSetting(db, 'savings_goal_amount');
  if (!name || !amount) return null;
  return { name, amount: parseFloat(amount) };
}

export async function getWishlistFund(db: SQLiteDatabase): Promise<number> {
  const value = await getSetting(db, 'wishlist_fund');
  return value ? parseFloat(value) : 0;
}

export async function getBigEvents(db: SQLiteDatabase): Promise<string> {
  const value = await getSetting(db, 'big_events');
  return value ?? '[]';
}
