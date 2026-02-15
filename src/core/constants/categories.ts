export const LEISURE_CATEGORIES: Record<string, { label: string; keywords: string[] }> = {
  food_dining: {
    label: 'Food & Dining',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'bar',
      'pub', 'bakery', 'food', 'delivery', 'wolt', 'japanika', '10bis',
      'מסעדה', 'בית קפה', 'קפה', 'פיצה', 'בורגר', 'סושי', 'משלוח',
      'אוכל', 'מאפייה',
    ],
  },
  entertainment: {
    label: 'Entertainment',
    keywords: [
      'cinema', 'movie', 'theater', 'concert', 'show', 'netflix', 'spotify',
      'disney', 'hbo', 'apple tv', 'youtube', 'gaming', 'steam', 'playstation',
      'xbox', 'nintendo', 'yes', 'hot',
      'קולנוע', 'סרט', 'תיאטרון', 'הופעה', 'מופע',
    ],
  },
  shopping: {
    label: 'Shopping',
    keywords: [
      'amazon', 'aliexpress', 'shein', 'zara', 'h&m', 'clothing', 'shoes',
      'fashion', 'mall', 'store', 'shop', 'purchase', 'asos',
      'קניון', 'חנות', 'ביגוד', 'נעליים', 'אופנה',
    ],
  },
  fitness: {
    label: 'Fitness & Wellness',
    keywords: [
      'gym', 'fitness', 'yoga', 'pilates', 'spa', 'massage', 'sport',
      'pool', 'swimming',
      'חדר כושר', 'יוגה', 'ספא', 'עיסוי', 'בריכה', 'שחייה',
    ],
  },
  transport_leisure: {
    label: 'Leisure Transport',
    keywords: [
      'uber', 'gett', 'bolt', 'taxi', 'yango',
      'מונית', 'הסעה',
    ],
  },
  subscriptions: {
    label: 'Subscriptions',
    keywords: [
      'subscription', 'monthly', 'membership', 'premium',
      'מנוי', 'חברות',
    ],
  },
  hobbies: {
    label: 'Hobbies',
    keywords: [
      'book', 'music', 'art', 'craft', 'photography', 'course', 'class',
      'ספר', 'מוזיקה', 'אומנות', 'קורס', 'שיעור',
    ],
  },
  other: {
    label: 'Other',
    keywords: [],
  },
};

export const CATEGORY_KEYS = Object.keys(LEISURE_CATEGORIES);

export function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  for (const [key, config] of Object.entries(LEISURE_CATEGORIES)) {
    if (key === 'other') continue;
    if (config.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return key;
    }
  }
  return 'other';
}
