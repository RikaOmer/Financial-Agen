import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction } from '@/src/types/database';

export async function getTransactionsForMonth(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<Transaction[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE timestamp >= ? AND timestamp < ?
     ORDER BY timestamp DESC`,
    [startDate, endDate]
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
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE timestamp >= ? AND timestamp < ?`,
    [startDate, endDate]
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
