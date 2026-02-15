import type { NormalizedTransaction } from '@/src/types/csv';
import { isNonLeisure } from '@/src/core/constants/filters';
import { categorizeTransaction } from '@/src/core/constants/categories';

interface FilterResult {
  leisure: NormalizedTransaction[];
  unrecognized: NormalizedTransaction[];
}

export function filterLeisureTransactions(
  transactions: NormalizedTransaction[]
): FilterResult {
  const leisure: NormalizedTransaction[] = [];
  const unrecognized: NormalizedTransaction[] = [];

  for (const tx of transactions) {
    if (isNonLeisure(tx.description)) continue;

    const category = categorizeTransaction(tx.description);
    if (category === 'other') {
      unrecognized.push(tx);
    } else {
      leisure.push(tx);
    }
  }

  return { leisure, unrecognized };
}
