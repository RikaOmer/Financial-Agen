import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '@/src/core/db/queries/settings';
import { decrementInstallments, deleteCompletedInstallments } from '@/src/core/db/queries/commitments';
import { processMonthEnd } from './month-end';

/**
 * Run monthly maintenance on app open:
 * 1. Calculate last month's surplus -> add to Wishlist Fund
 * 2. Decrement remaining_installments for all installments
 * 3. Delete completed installments (remaining = 0)
 * 4. Update last_active_month
 */
export async function runMonthTransition(db: SQLiteDatabase): Promise<boolean> {
  const lastActive = await getSetting(db, 'last_active_month');
  const currentMonth = new Date().toISOString().substring(0, 7);

  if (lastActive === currentMonth) return false;

  if (lastActive) {
    const [yearStr, monthStr] = lastActive.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    await processMonthEnd(db, year, month);
  }

  await decrementInstallments(db);
  await deleteCompletedInstallments(db);
  await setSetting(db, 'last_active_month', currentMonth);
  // Clear big events for the new month
  await setSetting(db, 'big_events', '[]');

  return true;
}
