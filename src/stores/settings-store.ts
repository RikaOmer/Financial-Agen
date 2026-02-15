import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting } from '@/src/core/db/queries/settings';

interface SettingsState {
  apiKey: string | null;
  monthlyTarget: number;
  savingsGoalName: string;
  savingsGoalAmount: number;
  loadApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setMonthlyTarget: (target: number) => void;
  setSavingsGoal: (name: string, amount: number) => void;
  hydrateFromDB: (db: SQLiteDatabase) => Promise<void>;
}

const API_KEY_STORAGE_KEY = 'anthropic_api_key';

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: null,
  monthlyTarget: 0,
  savingsGoalName: '',
  savingsGoalAmount: 0,

  loadApiKey: async () => {
    const key = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
    set({ apiKey: key });
  },

  setApiKey: async (key: string) => {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
    set({ apiKey: key });
  },

  setMonthlyTarget: (target: number) => set({ monthlyTarget: target }),

  setSavingsGoal: (name: string, amount: number) =>
    set({ savingsGoalName: name, savingsGoalAmount: amount }),

  hydrateFromDB: async (db: SQLiteDatabase) => {
    const target = await getSetting(db, 'monthly_leisure_target');
    const goalName = await getSetting(db, 'savings_goal_name');
    const goalAmount = await getSetting(db, 'savings_goal_amount');
    set({
      monthlyTarget: target ? parseFloat(target) : 0,
      savingsGoalName: goalName ?? '',
      savingsGoalAmount: goalAmount ? parseFloat(goalAmount) : 0,
    });
  },
}));
