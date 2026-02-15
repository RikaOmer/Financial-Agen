import type { NormalizedTransaction, DetectedCommitment } from '@/src/types/csv';
import { categorizeTransaction } from '@/src/core/constants/categories';

interface MerchantGroup {
  name: string;
  amounts: number[];
  dates: string[];
}

export function detectSubscriptions(
  transactions: NormalizedTransaction[]
): DetectedCommitment[] {
  // Group by similar merchant name and amount
  const groups = new Map<string, MerchantGroup>();

  for (const tx of transactions) {
    const key = normalizeKey(tx.description, tx.amount);
    const existing = groups.get(key);
    if (existing) {
      existing.dates.push(tx.date);
    } else {
      groups.set(key, {
        name: tx.description,
        amounts: [tx.amount],
        dates: [tx.date],
      });
    }
  }

  const commitments: DetectedCommitment[] = [];

  for (const [, group] of groups) {
    // Need at least 2 months of recurring charges
    const uniqueMonths = new Set(
      group.dates.map((d) => d.substring(0, 7)) // YYYY-MM
    );

    if (uniqueMonths.size >= 2) {
      commitments.push({
        name: group.name,
        amount: group.amounts[0],
        type: 'subscription',
        total_installments: null,
        remaining_installments: null,
        end_date: null,
        category: categorizeTransaction(group.name),
        selected: true,
      });
    }
  }

  return commitments;
}

function normalizeKey(description: string, amount: number): string {
  // Simple normalization: lowercase, remove numbers/special chars for grouping
  const normalized = description
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^\w\sא-ת]/g, '')
    .trim();
  return `${normalized}|${amount.toFixed(2)}`;
}
