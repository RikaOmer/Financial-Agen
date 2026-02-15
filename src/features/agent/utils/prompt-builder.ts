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

  parts.push('\nPlease evaluate this purchase and respond with JSON only.');

  return parts.join('\n');
}
