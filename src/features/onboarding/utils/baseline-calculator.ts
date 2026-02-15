import type { NormalizedTransaction } from '@/src/types/csv';
import { BASELINE_REDUCTION_FACTOR } from '@/src/core/constants/app-constants';

export function calculateBaseline(transactions: NormalizedTransaction[]): {
  baselineAvg: number;
  proposedTarget: number;
} {
  if (transactions.length === 0) {
    return { baselineAvg: 0, proposedTarget: 0 };
  }

  // Group transactions by month
  const monthlyTotals = new Map<string, number>();
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7); // YYYY-MM
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + tx.amount);
  }

  if (monthlyTotals.size === 0) {
    return { baselineAvg: 0, proposedTarget: 0 };
  }

  const totals = Array.from(monthlyTotals.values());
  const baselineAvg = totals.reduce((sum, v) => sum + v, 0) / totals.length;
  const proposedTarget = Math.round(baselineAvg * BASELINE_REDUCTION_FACTOR);

  return { baselineAvg: Math.round(baselineAvg), proposedTarget };
}
