import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  InterviewAnswer,
  SemanticAnalysisResult,
  LifeConstraint,
} from '@/src/types/behavioral';
import { upsertTrait, upsertCategoryConfig } from '@/src/core/db/queries/behavioral';
import { setSetting } from '@/src/core/db/queries/settings';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateConvenienceScore(
  answers: InterviewAnswer[],
  analysis: SemanticAnalysisResult
): number {
  // Base score from cluster frequency
  const totalOrders = analysis.convenienceClusters.reduce((s, c) => s + c.count, 0);
  let score = clamp(totalOrders / 20, 0, 0.6); // Up to 0.6 from frequency

  // Boost if user self-reported "pure convenience"
  const convenienceAnswer = answers.find(
    (a) => a.type === 'social_filter' && a.category === 'housekeeping'
  );
  if (convenienceAnswer?.value === 'Pure convenience') {
    score += 0.3;
  } else if (convenienceAnswer?.value === 'A mix of both') {
    score += 0.15;
  }

  return clamp(score, 0, 1);
}

function calculateSocialButterflyScore(
  answers: InterviewAnswer[],
  analysis: SemanticAnalysisResult
): number {
  let score = 0;

  const socialAnswers = answers.filter(
    (a) => a.type === 'social_filter' && a.value === 'Mostly shared / social'
  );
  score += socialAnswers.length * 0.3;

  const mixedAnswers = answers.filter(
    (a) => a.type === 'social_filter' && a.value === 'A mix of both'
  );
  score += mixedAnswers.length * 0.15;

  // Boost from outlier count (social spending tends to be higher)
  if (analysis.outliers.length > 3) {
    score += 0.1;
  }

  return clamp(score, 0, 1);
}

function calculateImpulseScore(
  analysis: SemanticAnalysisResult
): number {
  // Based on outlier count relative to total unique categories
  const outlierRatio = analysis.topCategories.length > 0
    ? analysis.outliers.length / (analysis.topCategories.reduce((s, c) => s + c.count, 0) || 1)
    : 0;

  return clamp(outlierRatio * 3, 0, 1);
}

export async function processInterviewResults(
  db: SQLiteDatabase,
  answers: InterviewAnswer[],
  analysis: SemanticAnalysisResult
): Promise<void> {
  // Calculate trait scores
  const convenienceScore = calculateConvenienceScore(answers, analysis);
  const socialScore = calculateSocialButterflyScore(answers, analysis);
  const impulseScore = calculateImpulseScore(analysis);

  // Persist traits
  await upsertTrait(db, 'convenience_addict', convenienceScore);
  await upsertTrait(db, 'social_butterfly', socialScore);
  await upsertTrait(db, 'impulse_spender', impulseScore);

  // Process emotional ROI answers → category_config
  const roiAnswers = answers.filter((a) => a.type === 'emotional_roi');
  for (const answer of roiAnswers) {
    if (answer.category) {
      const priority = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10);
      if (!isNaN(priority)) {
        await upsertCategoryConfig(
          db,
          answer.category,
          priority,
          priority <= 3, // Low joy categories are likely functional
          null
        );
      }
    }
  }

  // Process constraint confirmations
  const confirmedConstraints: LifeConstraint[] = [];
  const constraintAnswers = answers.filter((a) => a.type === 'constraint_confirm');
  for (const answer of constraintAnswers) {
    if (answer.value === "Yes, it's ongoing" && answer.constraintType) {
      const match = analysis.lifeConstraints.find(
        (c) => c.type === answer.constraintType
      );
      if (match) {
        confirmedConstraints.push(match);
      }
    }
  }

  // Store constraints in settings as JSON
  if (confirmedConstraints.length > 0) {
    await setSetting(db, 'user_constraints', JSON.stringify(confirmedConstraints));
  }
}
