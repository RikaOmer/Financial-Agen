import type { NormalizedTransaction } from './csv';

// --- Database Row Interfaces ---

export interface UserTraitRow {
  trait_id: string;
  score: number;
  last_updated: string;
}

export interface CategoryConfigRow {
  category_name: string;
  emotional_priority: number;
  is_functional: number; // SQLite boolean (0/1)
  notes: string | null;
}

export interface InterviewQueueRow {
  id: number;
  transaction_id: number | null;
  flag_reason: string;
  status: string;
}

// --- Domain Types ---

export interface UserTrait {
  traitId: string;
  score: number;
  lastUpdated: string;
}

export interface CategoryConfig {
  categoryName: string;
  emotionalPriority: number;
  isFunctional: boolean;
  notes: string | null;
}

export interface InterviewQueueItem {
  id: number;
  transactionId: number | null;
  flagReason: string;
  status: 'pending' | 'resolved';
}

// --- Semantic Analysis Types ---

export type SemanticFlag =
  | 'high_outlier'
  | 'convenience_cluster'
  | 'life_constraint'
  | 'potential_social_expense';

export interface FlaggedTransaction {
  transaction: NormalizedTransaction;
  flag: SemanticFlag;
  details: string;
  categoryMedian?: number;
}

export interface ConvenienceCluster {
  provider: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
  transactions: NormalizedTransaction[];
}

export interface LifeConstraint {
  type: 'pet' | 'academic' | 'hobby' | 'wellness' | 'professional';
  label: string;
  evidence: string[];
  confidence: number;
}

export interface SemanticAnalysisResult {
  outliers: FlaggedTransaction[];
  convenienceClusters: ConvenienceCluster[];
  lifeConstraints: LifeConstraint[];
  topCategories: Array<{ category: string; total: number; count: number }>;
}

// --- Interview Types ---

export type InterviewQuestionType = 'social_filter' | 'emotional_roi' | 'constraint_confirm';

export interface InterviewQuestion {
  id: string;
  type: InterviewQuestionType;
  prompt: string;
  category?: string;
  relatedTransactions?: NormalizedTransaction[];
  constraint?: LifeConstraint;
  options?: string[];
}

export interface InterviewAnswer {
  questionId: string;
  type: InterviewQuestionType;
  value: string | number;
  category?: string;
  constraintType?: string;
}

// --- Behavioral Context (used by AI Critic) ---

export interface BehavioralContext {
  primaryTrait: UserTrait | null;
  allTraits: UserTrait[];
  highPriorityCategories: string[];
  lowPriorityCategories: string[];
  constraints: LifeConstraint[];
}
