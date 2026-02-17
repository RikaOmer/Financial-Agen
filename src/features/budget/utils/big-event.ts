import type { BigEvent } from '@/src/types/budget';

/** Days from today (inclusive) until eventDate (inclusive). Minimum 1. */
function daysUntil(eventDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export function createBigEvent(
  name: string,
  amount: number,
  eventDate: string
): BigEvent {
  const days = daysUntil(new Date(eventDate));
  const amortizedDaily = amount / days;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    amount,
    date: eventDate,
    amortizedDaily,
  };
}

/** Recalculate daily amortization for all events (call on app open / day change). */
export function recalcBigEvents(events: BigEvent[]): BigEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.map((e) => {
    const target = new Date(e.date);
    target.setHours(0, 0, 0, 0);
    if (target < today) return { ...e, amortizedDaily: 0 }; // past event
    const days = daysUntil(target);
    return { ...e, amortizedDaily: e.amount / days };
  });
}

export function calculateBigEventAmortization(events: BigEvent[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events
    .filter((e) => new Date(e.date) >= today)
    .reduce((sum, e) => sum + e.amortizedDaily, 0);
}
