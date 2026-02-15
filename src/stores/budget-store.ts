import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { BudgetSnapshot, BigEvent } from '@/src/types/budget';
import { getMonthlyTarget, getWishlistFund, getBigEvents } from '@/src/core/db/queries/settings';
import { getTotalActiveCommitments } from '@/src/core/db/queries/commitments';
import { getTotalSpentThisMonth, getSpentOnDate } from '@/src/core/db/queries/transactions';
import { calculateDailyBudget } from '@/src/features/budget/utils/daily-budget';
import { daysRemainingInMonth, getYesterday, formatDate } from '@/src/utils/date';

interface BudgetState {
  snapshot: BudgetSnapshot;
  bigEvents: BigEvent[];
  isLoading: boolean;
  error: string | null;
  refreshBudget: (db: SQLiteDatabase) => Promise<void>;
}

const initialSnapshot: BudgetSnapshot = {
  monthlyTarget: 0,
  totalCommitments: 0,
  spentThisMonth: 0,
  daysRemaining: 0,
  dailyBudget: 0,
  rollingOffset: 0,
  bigEventAmortization: 0,
  wishlistFund: 0,
  surplus: 0,
};

export const useBudgetStore = create<BudgetState>((set) => ({
  snapshot: initialSnapshot,
  bigEvents: [],
  isLoading: false,
  error: null,

  refreshBudget: async (db: SQLiteDatabase) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const monthlyTarget = await getMonthlyTarget(db);
      const totalCommitments = await getTotalActiveCommitments(db);
      const spentThisMonth = await getTotalSpentThisMonth(db, year, month);
      const wishlistFund = await getWishlistFund(db);
      const daysRemaining = daysRemainingInMonth(now);

      // Rolling offset: if yesterday's spend was 0, carry forward
      const yesterday = getYesterday(now);
      const yesterdaySpend = await getSpentOnDate(db, formatDate(yesterday));

      // Big events
      const bigEventsJson = await getBigEvents(db);
      let bigEvents: BigEvent[] = [];
      try { bigEvents = JSON.parse(bigEventsJson); } catch { /* default empty */ }
      const bigEventAmortization = bigEvents.reduce(
        (sum, e) => sum + (e.amortizedDaily || 0),
        0
      );

      const rollingOffset = yesterdaySpend === 0
        ? calculateDailyBudget(
            monthlyTarget,
            totalCommitments,
            spentThisMonth,
            daysRemaining + 1,
            bigEventAmortization
          )
        : 0;

      const dailyBudget =
        calculateDailyBudget(
          monthlyTarget,
          totalCommitments,
          spentThisMonth,
          daysRemaining,
          bigEventAmortization
        ) + rollingOffset;

      const surplus = Math.max(0, monthlyTarget - totalCommitments - spentThisMonth);

      set({
        snapshot: {
          monthlyTarget,
          totalCommitments,
          spentThisMonth,
          daysRemaining,
          dailyBudget,
          rollingOffset,
          bigEventAmortization,
          wishlistFund,
          surplus,
        },
        bigEvents,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh budget',
      });
    }
  },
}));
