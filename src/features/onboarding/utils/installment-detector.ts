import type { NormalizedTransaction, DetectedCommitment } from '@/src/types/csv';
import { categorizeTransaction } from '@/src/core/constants/categories';

// Patterns for installment detection
const INSTALLMENT_PATTERNS = [
  // English: "3 of 12", "payment 3/12"
  /(\d+)\s*(?:of|\/)\s*(\d+)/i,
  // Hebrew: "תשלום 3 מתוך 12"
  /תשלום\s*(\d+)\s*מתוך\s*(\d+)/,
  // Hebrew short: "3/12 תשלומים"
  /(\d+)\s*[/]\s*(\d+)\s*תשלומים/,
  // Bank codes: "תש 03/12"
  /תש\s*(\d+)[/](\d+)/,
];

export function detectInstallments(
  transactions: NormalizedTransaction[]
): DetectedCommitment[] {
  const commitments: DetectedCommitment[] = [];
  const seen = new Set<string>();

  for (const tx of transactions) {
    for (const pattern of INSTALLMENT_PATTERNS) {
      const match = tx.description.match(pattern);
      if (match) {
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        if (total <= 0 || current <= 0 || current > total) continue;

        // Clean merchant name (remove installment text)
        const name = tx.description.replace(pattern, '').trim() || tx.description;
        const key = `${name}-${tx.amount}-${total}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const remaining = total - current + 1;
        commitments.push({
          name,
          amount: tx.amount,
          type: 'installment',
          total_installments: total,
          remaining_installments: remaining,
          end_date: null,
          category: categorizeTransaction(name),
          selected: true,
        });
        break;
      }
    }
  }

  return commitments;
}
