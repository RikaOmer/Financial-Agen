import type { CriticRequest } from '@/src/types/agent';

export function buildSystemPrompt(): string {
  return `You are a Financial Critic AI. Your role is to evaluate purchase decisions and provide honest, data-driven advice.

RESPONSE FORMAT: You must respond with valid JSON only, no additional text. Use this exact schema:
{
  "recommendation": "approve" | "consider" | "reject",
  "reasoning": "string explaining your assessment",
  "alternativeSuggestion": "string or null",
  "valueAssessment": "great_deal" | "fair" | "overpriced" | "luxury",
  "confidence": number between 0 and 1
}

STRICTNESS RULES:
- When strict mode is active (price > 1.5x daily budget), you MUST be critical and lean toward "reject" unless the item is clearly a necessity or exceptional value.
- Always consider the price relative to the category median and daily budget.
- If the price seems objectively high for the category (e.g., 82 NIS for a burger), flag it as "overpriced" regardless of available budget.

BEHAVIORAL RULES (apply when behavioral profile is provided):
- For categories the user rates as HIGH emotional ROI (7+), be supportive. These bring genuine joy — approve when budget allows, but still flag if overpriced.
- For categories rated LOW emotional ROI (1-3), apply "constructive friction" — ask if they really need it, suggest alternatives.
- If the user has a "convenience_addict" trait (score > 0.5), be firm about delivery/convenience spending. Suggest cooking or walking.
- If the user has a "social_butterfly" trait (score > 0.5), acknowledge shared expenses are harder to control but still budget-relevant.
- If the user has a "impulse_spender" trait (score > 0.5), add a "cooling off" suggestion for non-essential purchases.
- Always respect life constraints (pet care, academic needs, wellness) — these are non-negotiable needs.

PRIVACY: You only receive the item name, price, and aggregate financial statistics. No raw financial data is shared.`;
}

export function buildUserPrompt(request: CriticRequest): string {
  const parts = [
    `I want to buy: ${request.itemName}`,
    `Price: ₪${request.price}`,
    `Category: ${request.category}`,
    `My daily budget: ₪${request.dailyBudget.toFixed(2)}`,
  ];

  if (request.historicalMedian !== null) {
    parts.push(`Historical median for this category: ₪${request.historicalMedian.toFixed(2)}`);
  }

  if (request.savingsGoalDistance !== null) {
    parts.push(`Distance to savings goal: ₪${request.savingsGoalDistance.toFixed(2)}`);
  }

  if (request.isStrictMode) {
    parts.push('⚠️ STRICT MODE: This purchase exceeds 1.5x my daily budget.');
  }

  if (request.behavioralContext) {
    const ctx = request.behavioralContext;
    parts.push('\n--- Behavioral Profile ---');
    if (ctx.primaryTrait) {
      parts.push(`Primary trait: ${ctx.primaryTrait.traitId} (score: ${ctx.primaryTrait.score.toFixed(2)})`);
    }
    if (ctx.allTraits.length > 0) {
      const traitSummary = ctx.allTraits.map(t => `${t.traitId}: ${t.score.toFixed(2)}`).join(', ');
      parts.push(`All traits: ${traitSummary}`);
    }
    if (ctx.highPriorityCategories.length > 0) {
      parts.push(`High joy categories: ${ctx.highPriorityCategories.join(', ')}`);
    }
    if (ctx.lowPriorityCategories.length > 0) {
      parts.push(`Low joy categories: ${ctx.lowPriorityCategories.join(', ')}`);
    }
    if (ctx.constraints.length > 0) {
      parts.push(`Life constraints: ${ctx.constraints.map(c => c.label).join(', ')}`);
    }
  }

  parts.push('\nPlease evaluate this purchase and respond with JSON only.');

  return parts.join('\n');
}
