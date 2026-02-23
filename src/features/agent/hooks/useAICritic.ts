import { useState, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettingsStore } from '@/src/stores/settings-store';
import { useBudgetStore } from '@/src/stores/budget-store';
import { getMedianForCategory } from '@/src/core/db/queries/transactions';
import { getSavingsGoal, getWishlistFund } from '@/src/core/db/queries/settings';
import { callClaude } from '../utils/anthropic-client';
import { buildSystemPrompt, buildUserPrompt } from '../utils/prompt-builder';
import { parseVerdictResponse } from '../utils/response-parser';
import { validatePrice } from '../utils/price-validator';
import type { CriticVerdict, CriticRequest } from '@/src/types/agent';
import { STRICT_MODE_THRESHOLD, AI_COOLDOWN_MS } from '@/src/core/constants/app-constants';
import { useBehavioralStore } from '@/src/stores/behavioral-store';

type CriticStatus = 'idle' | 'loading' | 'done' | 'error';

export function useAICritic() {
  const db = useSQLiteContext();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const { snapshot } = useBudgetStore();
  const behavioralContext = useBehavioralStore((s) => s.behavioralContext);

  const [verdict, setVerdict] = useState<CriticVerdict | null>(null);
  const [status, setStatus] = useState<CriticStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastCallTime = useRef(0);

  const evaluate = useCallback(
    async (itemName: string, price: number, category: string) => {
      const now = Date.now();
      if (now - lastCallTime.current < AI_COOLDOWN_MS) {
        setError('Please wait a few seconds before trying again.');
        setStatus('error');
        return;
      }
      lastCallTime.current = now;
      setStatus('loading');
      setError(null);
      setVerdict(null);

      try {
        const isStrictMode = price > snapshot.dailyBudget * STRICT_MODE_THRESHOLD;
        const historicalMedian = await getMedianForCategory(db, category);
        const savingsGoal = await getSavingsGoal(db);
        const wishlistFund = await getWishlistFund(db);

        const savingsGoalDistance = savingsGoal
          ? Math.max(0, savingsGoal.amount - wishlistFund)
          : null;

        const priceValidation = validatePrice(price, category);

        const request: CriticRequest = {
          itemName,
          price,
          category,
          dailyBudget: snapshot.dailyBudget,
          historicalMedian,
          savingsGoalDistance,
          isStrictMode: isStrictMode || priceValidation.isObjectivelyExpensive,
          behavioralContext: behavioralContext ?? undefined,
        };

        if (!apiKey) {
          // Offline fallback
          const budgetPercentage = snapshot.dailyBudget > 0
            ? Math.round((price / snapshot.dailyBudget) * 100)
            : 0;

          let behavioralHint = '';
          if (behavioralContext) {
            if (behavioralContext.highPriorityCategories.includes(category)) {
              behavioralHint = ' This is a high-joy category for you.';
            } else if (behavioralContext.lowPriorityCategories.includes(category)) {
              behavioralHint = ' This is a low-joy category — consider skipping.';
            }
            const convenienceTrait = behavioralContext.allTraits.find(t => t.traitId === 'convenience_addict');
            if (convenienceTrait && convenienceTrait.score > 0.5 && (category === 'housekeeping' || category === 'food_dining')) {
              behavioralHint += ' Watch out — this matches your convenience spending pattern.';
            }
          }

          setVerdict({
            recommendation: price > snapshot.dailyBudget ? 'reject' : 'consider',
            reasoning: `Based on budget alone, this uses ${budgetPercentage}% of your daily budget. ${
              priceValidation.isObjectivelyExpensive
                ? `This price seems high for the ${category} category.`
                : ''
            }${behavioralHint}`,
            alternativeSuggestion: null,
            valueAssessment: priceValidation.isObjectivelyExpensive ? 'overpriced' : 'fair',
            confidence: 0.4,
          });
          setStatus('done');
          return;
        }

        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(request);
        const rawResponse = await callClaude(apiKey, systemPrompt, userPrompt);
        const parsedVerdict = parseVerdictResponse(rawResponse);

        setVerdict(parsedVerdict);
        setStatus('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to evaluate');
        setStatus('error');
      }
    },
    [db, apiKey, snapshot.dailyBudget, behavioralContext]
  );

  const reset = useCallback(() => {
    setVerdict(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { verdict, status, error, evaluate, reset };
}
