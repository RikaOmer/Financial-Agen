import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  SemanticAnalysisResult,
  InterviewQuestion,
  InterviewAnswer,
  BehavioralContext,
  LifeConstraint,
} from '@/src/types/behavioral';
import type { NormalizedTransaction } from '@/src/types/csv';
import { analyzeTransactions } from '@/src/features/behavioral/utils/semantic-detective';
import { generateInterviewQuestions } from '@/src/features/behavioral/utils/interview-generator';
import { processInterviewResults } from '@/src/features/behavioral/utils/trait-calculator';
import {
  getAllTraits,
  getPrimaryTrait,
  getHighPriorityCategories,
  getLowPriorityCategories,
} from '@/src/core/db/queries/behavioral';
import { getSetting } from '@/src/core/db/queries/settings';

interface BehavioralState {
  analysisResult: SemanticAnalysisResult | null;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  currentQuestionIndex: number;
  behavioralContext: BehavioralContext | null;

  runAnalysis: (transactions: NormalizedTransaction[]) => void;
  answerQuestion: (answer: InterviewAnswer) => void;
  goBack: () => void;
  finalizeInterview: (db: SQLiteDatabase) => Promise<void>;
  loadBehavioralContext: (db: SQLiteDatabase) => Promise<void>;
  reset: () => void;
}

export const useBehavioralStore = create<BehavioralState>((set, get) => ({
  analysisResult: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  behavioralContext: null,

  runAnalysis: (transactions: NormalizedTransaction[]) => {
    const result = analyzeTransactions(transactions);
    const questions = generateInterviewQuestions(result);
    set({ analysisResult: result, questions, answers: [], currentQuestionIndex: 0 });
  },

  answerQuestion: (answer: InterviewAnswer) => {
    set((state) => ({
      answers: [...state.answers, answer],
      currentQuestionIndex: state.currentQuestionIndex + 1,
    }));
  },

  goBack: () => {
    set((state) => {
      if (state.currentQuestionIndex <= 0) return state;
      const answers = state.answers.slice(0, -1);
      return {
        answers,
        currentQuestionIndex: state.currentQuestionIndex - 1,
      };
    });
  },

  finalizeInterview: async (db: SQLiteDatabase) => {
    const { answers, analysisResult } = get();
    if (!analysisResult) return;
    await processInterviewResults(db, answers, analysisResult);
    // Reload context after saving
    await get().loadBehavioralContext(db);
  },

  loadBehavioralContext: async (db: SQLiteDatabase) => {
    try {
      const primaryTrait = await getPrimaryTrait(db);
      const allTraits = await getAllTraits(db);
      const highPriorityCategories = await getHighPriorityCategories(db);
      const lowPriorityCategories = await getLowPriorityCategories(db);

      let constraints: LifeConstraint[] = [];
      const constraintsJson = await getSetting(db, 'user_constraints');
      if (constraintsJson) {
        try {
          constraints = JSON.parse(constraintsJson);
        } catch { /* default empty */ }
      }

      set({
        behavioralContext: {
          primaryTrait,
          allTraits,
          highPriorityCategories,
          lowPriorityCategories,
          constraints,
        },
      });
    } catch {
      // Silently fail — behavioral context is optional
    }
  },

  reset: () => {
    set({
      analysisResult: null,
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      behavioralContext: null,
    });
  },
}));
