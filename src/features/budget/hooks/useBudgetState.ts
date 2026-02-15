import { useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useBudgetStore } from '@/src/stores/budget-store';

export function useBudgetState() {
  const db = useSQLiteContext();
  const { snapshot, bigEvents, isLoading, refreshBudget } = useBudgetStore();

  const refresh = useCallback(() => {
    refreshBudget(db);
  }, [db, refreshBudget]);

  useEffect(() => {
    refresh();

    // Refresh at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      refresh();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [refresh]);

  return { snapshot, bigEvents, isLoading, refresh };
}
