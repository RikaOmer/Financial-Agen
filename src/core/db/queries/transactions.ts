import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction } from '@/src/types/database';
import { getMonthRange } from '@/src/utils/date';

export async function getTransactionsForMonth(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<Transaction[]> {
  const { start, end } = getMonthRange(year, month);

  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE timestamp >= ? AND timestamp < ?
     ORDER BY timestamp DESC`,
    [start, end]
  );
}

export async function insertTransaction(
  db: SQLiteDatabase,
  transaction: Omit<Transaction, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO transactions (amount, description, category, timestamp)
     VALUES (?, ?, ?, ?)`,
    [
      transaction.amount,
      transaction.description,
      transaction.category,
      transaction.timestamp,
    ]
  );
  return result.lastInsertRowId;
}

export async function getMedianForCategory(
  db: SQLiteDatabase,
  category: string
): Promise<number | null> {
  const rows = await db.getAllAsync<{ amount: number }>(
    `SELECT amount FROM transactions
     WHERE category = ?
     ORDER BY amount`,
    [category]
  );
  if (rows.length === 0) return null;
  const mid = Math.floor(rows.length / 2);
  return rows.length % 2 === 0
    ? (rows[mid - 1].amount + rows[mid].amount) / 2
    : rows[mid].amount;
}

export async function getTotalSpentThisMonth(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<number> {
  const { start, end } = getMonthRange(year, month);

  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE timestamp >= ? AND timestamp < ?`,
    [start, end]
  );
  return result?.total ?? 0;
}

export async function getSpentOnDate(
  db: SQLiteDatabase,
  dateStr: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE date(timestamp) = date(?)`,
    [dateStr]
  );
  return result?.total ?? 0;
}

export async function getTodayTransactions(
  db: SQLiteDatabase
): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE date(timestamp) = date('now')
     ORDER BY timestamp DESC`
  );
}

export async function deleteTransaction(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: number,
  fields: Partial<Omit<Transaction, 'id'>>
): Promise<void> {
  const entries = Object.entries(fields).filter(([_, v]) => v !== undefined);
  if (entries.length === 0) return;
  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([_, v]) => v);
  await db.runAsync(
    `UPDATE transactions SET ${setClauses} WHERE id = ?`,
    [...values, id]
  );
}
