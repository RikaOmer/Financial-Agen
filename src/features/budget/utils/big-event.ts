import type { BigEvent } from '@/src/types/budget';
import { daysRemainingInMonth } from '@/src/utils/date';

export function createBigEvent(
  name: string,
  amount: number,
  date: string
): BigEvent {
  const eventDate = new Date(date);
  const remaining = daysRemainingInMonth(eventDate);
  const amortizedDaily = remaining > 0 ? amount / remaining : amount;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    amount,
    date,
    amortizedDaily,
  };
}

export function calculateBigEventAmortization(events: BigEvent[]): number {
  const today = new Date().toISOString().substring(0, 7);
  return events
    .filter((e) => e.date.substring(0, 7) === today)
    .reduce((sum, e) => sum + e.amortizedDaily, 0);
}
