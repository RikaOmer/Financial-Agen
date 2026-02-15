import type { Commitment } from '@/src/types/database';

interface MonthProjection {
  month: string; // YYYY-MM
  totalCommitments: number;
  breakdown: Array<{ name: string; amount: number; type: string }>;
}

export function projectCommitments(
  commitments: Commitment[],
  monthsAhead: number = 6
): MonthProjection[] {
  const projections: MonthProjection[] = [];
  const now = new Date();

  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const breakdown: MonthProjection['breakdown'] = [];

    for (const c of commitments) {
      if (c.type === 'subscription') {
        breakdown.push({ name: c.name, amount: c.amount, type: 'subscription' });
      } else if (c.type === 'installment' && c.remaining_installments) {
        if (c.remaining_installments > i) {
          breakdown.push({ name: c.name, amount: c.amount, type: 'installment' });
        }
      }
    }

    projections.push({
      month: monthKey,
      totalCommitments: breakdown.reduce((sum, b) => sum + b.amount, 0),
      breakdown,
    });
  }

  return projections;
}
