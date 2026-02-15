import { create } from 'zustand';
import type { NormalizedTransaction, DetectedCommitment } from '@/src/types/csv';

interface OnboardingState {
  csvTransactions: NormalizedTransaction[];
  detectedCommitments: DetectedCommitment[];
  unrecognizedItems: NormalizedTransaction[];
  baselineAvg: number;
  proposedTarget: number;
  setCsvData: (data: {
    transactions: NormalizedTransaction[];
    commitments: DetectedCommitment[];
    unrecognized: NormalizedTransaction[];
    baselineAvg: number;
    proposedTarget: number;
  }) => void;
  toggleCommitment: (index: number) => void;
  updateCommitmentCategory: (index: number, category: string) => void;
  classifyUnrecognized: (index: number, category: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  csvTransactions: [],
  detectedCommitments: [],
  unrecognizedItems: [],
  baselineAvg: 0,
  proposedTarget: 0,

  setCsvData: (data) =>
    set({
      csvTransactions: data.transactions,
      detectedCommitments: data.commitments,
      unrecognizedItems: data.unrecognized,
      baselineAvg: data.baselineAvg,
      proposedTarget: data.proposedTarget,
    }),

  toggleCommitment: (index) =>
    set((state) => {
      const updated = [...state.detectedCommitments];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return { detectedCommitments: updated };
    }),

  updateCommitmentCategory: (index, category) =>
    set((state) => {
      const updated = [...state.detectedCommitments];
      updated[index] = { ...updated[index], category };
      return { detectedCommitments: updated };
    }),

  classifyUnrecognized: (index, category) =>
    set((state) => {
      const unrecognized = [...state.unrecognizedItems];
      const item = unrecognized.splice(index, 1)[0];
      const transactions = [
        ...state.csvTransactions,
        { ...item, description: `${item.description} [${category}]` },
      ];
      return { unrecognizedItems: unrecognized, csvTransactions: transactions };
    }),

  reset: () =>
    set({
      csvTransactions: [],
      detectedCommitments: [],
      unrecognizedItems: [],
      baselineAvg: 0,
      proposedTarget: 0,
    }),
}));
