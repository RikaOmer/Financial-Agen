import type {
  SemanticAnalysisResult,
  InterviewQuestion,
} from '@/src/types/behavioral';
import { LEISURE_CATEGORIES, categorizeTransaction } from '@/src/core/constants/categories';

/** Categories where asking "how much joy" makes sense — genuinely discretionary */
const JOY_ELIGIBLE_CATEGORIES = new Set([
  'food_dining',
  'entertainment',
  'shopping',
]);

let questionCounter = 0;
function nextId(): string {
  return `q_${++questionCounter}`;
}

function generateSocialFilterQuestions(
  analysis: SemanticAnalysisResult
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Group outliers by actual category (using categorizeTransaction, not string matching)
  const outliersByCategory = new Map<string, typeof analysis.outliers>();
  for (const outlier of analysis.outliers) {
    const cat = categorizeTransaction(outlier.transaction.description);
    const arr = outliersByCategory.get(cat);
    if (arr) arr.push(outlier);
    else outliersByCategory.set(cat, [outlier]);
  }

  // Ask about high-value restaurant/dining outliers
  const diningOutliers = outliersByCategory.get('food_dining') ?? [];
  if (diningOutliers.length > 0) {
    questions.push({
      id: nextId(),
      type: 'social_filter',
      prompt: 'I noticed some higher-than-usual restaurant spending. Are these typically shared social meals or personal dining?',
      category: 'food_dining',
      relatedTransactions: diningOutliers.map((o) => o.transaction),
      options: ['Mostly shared / social', 'Mostly personal', 'A mix of both'],
    });
  }

  // Ask about entertainment outliers
  const entertainmentOutliers = outliersByCategory.get('entertainment') ?? [];
  if (entertainmentOutliers.length > 0) {
    questions.push({
      id: nextId(),
      type: 'social_filter',
      prompt: 'You have some notable entertainment expenses. Are these social outings or personal entertainment?',
      category: 'entertainment',
      relatedTransactions: entertainmentOutliers.map((o) => o.transaction),
      options: ['Mostly shared / social', 'Mostly personal', 'A mix of both'],
    });
  }

  // Ask about convenience delivery habit
  if (analysis.convenienceClusters.length > 0) {
    const names = analysis.convenienceClusters.map((c) => c.provider).join(', ');
    const totalOrders = analysis.convenienceClusters.reduce((s, c) => s + c.count, 0);
    questions.push({
      id: nextId(),
      type: 'social_filter',
      prompt: `You ordered delivery ${totalOrders} times (${names}). Is this mainly for convenience, or are there days you simply can't cook?`,
      category: 'housekeeping',
      options: ['Pure convenience', 'No time / energy to cook', 'A mix of both'],
    });
  }

  return questions;
}

function generateEmotionalRoiQuestions(
  analysis: SemanticAnalysisResult
): InterviewQuestion[] {
  if (analysis.topCategories.length === 0) return [];

  const questions: InterviewQuestion[] = [];
  for (const cat of analysis.topCategories) {
    // Skip functional categories — nobody gets joy from groceries or subscriptions
    if (!JOY_ELIGIBLE_CATEGORIES.has(cat.category)) continue;

    const label = LEISURE_CATEGORIES[cat.category]?.label ?? cat.category;
    questions.push({
      id: nextId(),
      type: 'emotional_roi',
      prompt: `How much joy does "${label}" spending bring you? (1 = no joy, 10 = essential to my happiness)`,
      category: cat.category,
    });
  }
  return questions;
}

function generateConstraintQuestions(
  analysis: SemanticAnalysisResult
): InterviewQuestion[] {
  return analysis.lifeConstraints.map((constraint) => ({
    id: nextId(),
    type: 'constraint_confirm' as const,
    prompt: `We detected spending that suggests: "${constraint.label}". Is this an ongoing commitment in your life?`,
    constraint,
    options: ['Yes, it\'s ongoing', 'No, it was temporary', 'It\'s occasional'],
  }));
}

export function generateInterviewQuestions(
  analysis: SemanticAnalysisResult
): InterviewQuestion[] {
  questionCounter = 0;

  const questions: InterviewQuestion[] = [
    ...generateSocialFilterQuestions(analysis),
    ...generateEmotionalRoiQuestions(analysis),
    ...generateConstraintQuestions(analysis),
  ];

  return questions;
}
