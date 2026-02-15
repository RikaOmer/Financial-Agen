import type { SQLiteDatabase } from 'expo-sqlite';
import { getMonthlyTarget, getWishlistFund, setSetting } from '@/src/core/db/queries/settings';
import { getTotalActiveCommitments } from '@/src/core/db/queries/commitments';
import { getTotalSpentThisMonth } from '@/src/core/db/queries/transactions';

/**
 * At month end, any surplus goes to Wishlist Fund (not rolled into next month's leisure)
 */
export async function processMonthEnd(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<number> {
  const monthlyTarget = await getMonthlyTarget(db);
  const totalCommitments = await getTotalActiveCommitments(db);
  const totalSpent = await getTotalSpentThisMonth(db, year, month);

  const surplus = Math.max(0, monthlyTarget - totalCommitments - totalSpent);

  if (surplus > 0) {
    const currentFund = await getWishlistFund(db);
    await setSetting(db, 'wishlist_fund', String(currentFund + surplus));
  }

  return surplus;
}
