import type { SQLiteDatabase } from 'expo-sqlite';
import type { Commitment } from '@/src/types/database';

export async function getActiveCommitments(db: SQLiteDatabase): Promise<Commitment[]> {
  return db.getAllAsync<Commitment>(
    `SELECT * FROM commitments
     WHERE type = 'subscription'
        OR (type = 'installment' AND remaining_installments > 0)
     ORDER BY type, name`
  );
}

export async function insertCommitment(
  db: SQLiteDatabase,
  commitment: Omit<Commitment, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO commitments (name, amount, type, total_installments, remaining_installments, end_date, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      commitment.name,
      commitment.amount,
      commitment.type,
      commitment.total_installments,
      commitment.remaining_installments,
      commitment.end_date,
      commitment.category,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateCommitment(
  db: SQLiteDatabase,
  id: number,
  fields: Partial<Omit<Commitment, 'id'>>
): Promise<void> {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    values.push(value as string | number | null);
  }

  if (setClauses.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE commitments SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteCommitment(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM commitments WHERE id = ?', [id]);
}

export async function decrementInstallments(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `UPDATE commitments
     SET remaining_installments = remaining_installments - 1
     WHERE type = 'installment' AND remaining_installments > 0`
  );
}

export async function deleteCompletedInstallments(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `DELETE FROM commitments
     WHERE type = 'installment' AND remaining_installments <= 0`
  );
}

export async function getTotalActiveCommitments(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM commitments
     WHERE type = 'subscription'
        OR (type = 'installment' AND remaining_installments > 0)`
  );
  return result?.total ?? 0;
}
