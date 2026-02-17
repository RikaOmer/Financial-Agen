import { create } from 'zustand';
import type { NormalizedTransaction, DetectedCommitment } from '@/src/types/csv';
import { categorizeTransaction } from '@/src/core/constants/categories';

export interface MerchantGroup {
  name: string;
  transactions: NormalizedTransaction[];
  totalAmount: number;
}

interface OnboardingState {
  csvTransactions: NormalizedTransaction[];
  detectedCommitments: DetectedCommitment[];
  unrecognizedItems: NormalizedTransaction[];
  unrecognizedGroups: MerchantGroup[];
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
  classifyMerchantGroup: (groupIndex: number, category: string) => void;
  skipMerchantGroup: (groupIndex: number) => void;
  reset: () => void;
}

function groupByMerchant(items: NormalizedTransaction[]): MerchantGroup[] {
  const map = new Map<string, NormalizedTransaction[]>();
  for (const tx of items) {
    const key = tx.description.trim().toLowerCase();
    const arr = map.get(key);
    if (arr) arr.push(tx);
    else map.set(key, [tx]);
  }
  return Array.from(map.values()).map((txs) => ({
    name: txs[0].description,
    transactions: txs,
    totalAmount: txs.reduce((s, t) => s + t.amount, 0),
  }));
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  csvTransactions: [],
  detectedCommitments: [],
  unrecognizedItems: [],
  unrecognizedGroups: [],
  baselineAvg: 0,
  proposedTarget: 0,

  setCsvData: (data) => {
    const groups = groupByMerchant(data.unrecognized);
    set({
      csvTransactions: data.transactions,
      detectedCommitments: data.commitments,
      unrecognizedItems: data.unrecognized,
      unrecognizedGroups: groups,
      baselineAvg: data.baselineAvg,
      proposedTarget: data.proposedTarget,
    });
  },

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

  classifyMerchantGroup: (groupIndex, category) =>
    set((state) => {
      const groups = [...state.unrecognizedGroups];
      const group = groups.splice(groupIndex, 1)[0];
      // Add all transactions from this merchant to leisure with category tag
      const newTxs = group.transactions.map((tx) => ({
        ...tx,
        description: `${tx.description} [${category}]`,
      }));
      // Remove these from the flat unrecognized list too
      const merchantKey = group.name.trim().toLowerCase();
      const unrecognized = state.unrecognizedItems.filter(
        (tx) => tx.description.trim().toLowerCase() !== merchantKey
      );

      // If classified as subscription, also add to detectedCommitments
      let commitments = state.detectedCommitments;
      if (category === 'subscriptions') {
        // Use median amount as the subscription amount
        const amounts = group.transactions.map((tx) => tx.amount).sort((a, b) => a - b);
        const medianAmount = amounts[Math.floor(amounts.length / 2)];
        const newCommitment: DetectedCommitment = {
          name: group.name,
          amount: medianAmount,
          type: 'subscription',
          total_installments: null,
          remaining_installments: null,
          end_date: null,
          category: categorizeTransaction(group.name),
          selected: true,
        };
        commitments = [...commitments, newCommitment];
      }

      return {
        csvTransactions: [...state.csvTransactions, ...newTxs],
        unrecognizedItems: unrecognized,
        unrecognizedGroups: groups,
        detectedCommitments: commitments,
      };
    }),

  skipMerchantGroup: (groupIndex) =>
    set((state) => {
      const groups = [...state.unrecognizedGroups];
      const group = groups.splice(groupIndex, 1)[0];
      const merchantKey = group.name.trim().toLowerCase();
      const unrecognized = state.unrecognizedItems.filter(
        (tx) => tx.description.trim().toLowerCase() !== merchantKey
      );
      return {
        unrecognizedItems: unrecognized,
        unrecognizedGroups: groups,
      };
    }),

  reset: () =>
    set({
      csvTransactions: [],
      detectedCommitments: [],
      unrecognizedItems: [],
      unrecognizedGroups: [],
      baselineAvg: 0,
      proposedTarget: 0,
    }),
}));
