import type { Transaction } from '@/src/types/database';
import type { NormalizedTransaction } from '@/src/types/csv';

export interface DuplicateMatch {
  transaction: Transaction;
  csvEntry: NormalizedTransaction;
  confidence: number;
}

/**
 * Match manual entries with CSV records to avoid double-counting.
 * Criteria: same amount, date ±2 days, description similarity.
 */
export function findDuplicates(
  existingTransactions: Transaction[],
  csvTransactions: NormalizedTransaction[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const tx of existingTransactions) {
    for (const csv of csvTransactions) {
      const amountMatch = Math.abs(tx.amount - csv.amount) < 0.01;
      const dateClose = isDateClose(tx.timestamp, csv.date, 2);
      const descSimilar = descriptionSimilarity(tx.description, csv.description) > 0.5;

      if (amountMatch && dateClose) {
        const confidence = descSimilar ? 0.95 : 0.7;
        matches.push({ transaction: tx, csvEntry: csv, confidence });
      }
    }
  }

  return matches;
}

function isDateClose(dateA: string, dateB: string, maxDaysDiff: number): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = Math.abs(a.getTime() - b.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= maxDaysDiff;
}

function descriptionSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}
