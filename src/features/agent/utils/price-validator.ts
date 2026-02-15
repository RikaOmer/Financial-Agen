// Hardcoded price ceilings per category (in NIS)
const CATEGORY_CEILINGS: Record<string, number> = {
  food_dining: 120,
  entertainment: 200,
  shopping: 500,
  fitness: 350,
  transport_leisure: 80,
  hobbies: 300,
  subscriptions: 100,
  other: 200,
};

export interface PriceValidation {
  isObjectivelyExpensive: boolean;
  ceiling: number | null;
  exceedsBy: number;
}

export function validatePrice(price: number, category: string): PriceValidation {
  const ceiling = CATEGORY_CEILINGS[category] ?? null;

  if (ceiling === null) {
    return { isObjectivelyExpensive: false, ceiling: null, exceedsBy: 0 };
  }

  const isObjectivelyExpensive = price > ceiling;
  const exceedsBy = Math.max(0, price - ceiling);

  return { isObjectivelyExpensive, ceiling, exceedsBy };
}
