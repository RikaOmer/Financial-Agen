import type { CriticVerdict } from '@/src/types/agent';

const VALID_RECOMMENDATIONS = ['approve', 'consider', 'reject'] as const;
const VALID_ASSESSMENTS = ['great_deal', 'fair', 'overpriced', 'luxury'] as const;

export function parseVerdictResponse(rawText: string): CriticVerdict {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and normalize
  const recommendation = VALID_RECOMMENDATIONS.includes(parsed.recommendation)
    ? parsed.recommendation
    : 'consider';

  const valueAssessment = VALID_ASSESSMENTS.includes(parsed.valueAssessment)
    ? parsed.valueAssessment
    : 'fair';

  return {
    recommendation,
    reasoning: String(parsed.reasoning ?? 'No reasoning provided'),
    alternativeSuggestion: parsed.alternativeSuggestion ?? null,
    valueAssessment,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
  };
}
