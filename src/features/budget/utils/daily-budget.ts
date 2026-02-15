/**
 * B_daily = (Target - Commitments - Spent - BigEventAmortization) / DaysRemaining
 */
export function calculateDailyBudget(
  monthlyTarget: number,
  totalCommitments: number,
  spentThisMonth: number,
  daysRemaining: number,
  bigEventAmortization: number = 0
): number {
  if (daysRemaining <= 0) return 0;
  const available = monthlyTarget - totalCommitments - spentThisMonth - bigEventAmortization;
  return Math.max(0, available / daysRemaining);
}
