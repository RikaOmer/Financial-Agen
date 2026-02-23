import type { BehavioralContext } from './behavioral';

export interface CriticRequest {
  itemName: string;
  price: number;
  category: string;
  dailyBudget: number;
  historicalMedian: number | null;
  savingsGoalDistance: number | null;
  isStrictMode: boolean;
  behavioralContext?: BehavioralContext;
}

export interface CriticVerdict {
  recommendation: 'approve' | 'consider' | 'reject';
  reasoning: string;
  alternativeSuggestion: string | null;
  valueAssessment: 'great_deal' | 'fair' | 'overpriced' | 'luxury';
  confidence: number;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  id: string;
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
}
