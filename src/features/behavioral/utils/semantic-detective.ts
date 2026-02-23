import type { NormalizedTransaction } from '@/src/types/csv';
import type {
  SemanticAnalysisResult,
  FlaggedTransaction,
  ConvenienceCluster,
  LifeConstraint,
} from '@/src/types/behavioral';
import { categorizeTransaction } from '@/src/core/constants/categories';

const OUTLIER_THRESHOLD = 0.8; // 80% above median

/**
 * Strip trailing installment numbers and Hebrew installment patterns
 * so "ישיר ביטוח 5" and "ישיר ביטוח 6" collapse to the same key.
 */
function normalizeMerchantName(description: string): string {
  return description
    .replace(/\s*תשלום\s*\d+\s*מתוך\s*\d+/g, '')   // תשלום X מתוך Y
    .replace(/\s*\d+\/\d+\s*תשלומים/g, '')           // X/Y תשלומים
    .replace(/\s*תש\s*\d+\/\d+/g, '')                // תש XX/YY
    .replace(/\s+\d+\s*of\s+\d+/gi, '')              // X of Y
    .replace(/\s+\d+\s*$/, '')                        // trailing number
    .trim()
    .toLowerCase();
}

const CONVENIENCE_PROVIDERS = [
  'wolt', 'bolt food', '10bis', 'japanika', 'dominos', 'pizza hut',
  'uber eats', 'tenbis', 'cibus', 'mishloha',
  'וולט', 'בולט', 'תן ביס', 'משלוחה',
];

const LIFE_CONSTRAINT_KEYWORDS: Record<LifeConstraint['type'], string[]> = {
  pet: [
    'pet', 'vet', 'veterinary', 'dog', 'cat', 'petshop', 'pet shop',
    'חיות', 'וטרינר', 'כלב', 'חתול', 'חנות חיות',
  ],
  academic: [
    'university', 'college', 'course', 'tuition', 'textbook', 'udemy', 'coursera',
    'אוניברסיטה', 'מכללה', 'קורס', 'שכר לימוד', 'לימודים',
  ],
  hobby: [
    'art supply', 'music store', 'instrument', 'craft', 'photography',
    'אומנות', 'מוזיקה', 'כלי נגינה', 'צילום', 'יצירה',
  ],
  wellness: [
    'gym', 'fitness', 'yoga', 'pilates', 'spa', 'massage', 'therapy', 'psycholog',
    'חדר כושר', 'כושר', 'יוגה', 'פילאטיס', 'ספא', 'עיסוי', 'טיפול', 'פסיכולוג',
  ],
  professional: [
    'coworking', 'wework', 'mindspace', 'office', 'software', 'license',
    'חלל עבודה', 'משרד', 'תוכנה', 'רישיון',
  ],
};

function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function detectOutliers(transactions: NormalizedTransaction[]): FlaggedTransaction[] {
  const byCategory = new Map<string, NormalizedTransaction[]>();
  for (const tx of transactions) {
    const cat = categorizeTransaction(tx.description);
    const arr = byCategory.get(cat);
    if (arr) arr.push(tx);
    else byCategory.set(cat, [tx]);
  }

  // Collect all outliers, then deduplicate by merchant
  const rawFlagged: FlaggedTransaction[] = [];
  for (const [category, txs] of byCategory) {
    if (category === 'other' || txs.length < 3) continue;
    const median = getMedian(txs.map((t) => t.amount));
    const threshold = median * (1 + OUTLIER_THRESHOLD);

    for (const tx of txs) {
      if (tx.amount > threshold) {
        rawFlagged.push({
          transaction: tx,
          flag: 'high_outlier',
          details: `₪${tx.amount.toFixed(0)} is ${Math.round(((tx.amount - median) / median) * 100)}% above the ${category} median of ₪${median.toFixed(0)}`,
          categoryMedian: median,
        });
      }
    }
  }

  // Deduplicate: keep only the highest-amount outlier per normalized merchant
  const byMerchant = new Map<string, FlaggedTransaction>();
  for (const item of rawFlagged) {
    const key = normalizeMerchantName(item.transaction.description);
    const existing = byMerchant.get(key);
    if (!existing || item.transaction.amount > existing.transaction.amount) {
      byMerchant.set(key, item);
    }
  }
  return Array.from(byMerchant.values());
}

function detectConvenienceClusters(
  transactions: NormalizedTransaction[]
): ConvenienceCluster[] {
  const clusters = new Map<string, NormalizedTransaction[]>();

  for (const tx of transactions) {
    const lower = tx.description.toLowerCase();
    for (const provider of CONVENIENCE_PROVIDERS) {
      if (lower.includes(provider)) {
        const arr = clusters.get(provider);
        if (arr) arr.push(tx);
        else clusters.set(provider, [tx]);
        break;
      }
    }
  }

  const result: ConvenienceCluster[] = [];
  for (const [provider, txs] of clusters) {
    if (txs.length >= 3) {
      const total = txs.reduce((s, t) => s + t.amount, 0);
      result.push({
        provider,
        count: txs.length,
        totalAmount: total,
        averageAmount: total / txs.length,
        transactions: txs,
      });
    }
  }
  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

function detectLifeConstraints(
  transactions: NormalizedTransaction[]
): LifeConstraint[] {
  const constraints: LifeConstraint[] = [];

  for (const [type, keywords] of Object.entries(LIFE_CONSTRAINT_KEYWORDS) as Array<
    [LifeConstraint['type'], string[]]
  >) {
    const evidence: string[] = [];
    for (const tx of transactions) {
      const lower = tx.description.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        evidence.push(tx.description);
      }
    }
    if (evidence.length >= 2) {
      const labels: Record<LifeConstraint['type'], string> = {
        pet: 'Pet Owner',
        academic: 'Student / Learner',
        hobby: 'Active Hobbyist',
        wellness: 'Wellness Focused',
        professional: 'Professional Tools',
      };
      constraints.push({
        type,
        label: labels[type],
        evidence: [...new Set(evidence)].slice(0, 5),
        confidence: Math.min(1, evidence.length / 5),
      });
    }
  }
  return constraints;
}

function getTopCategories(
  transactions: NormalizedTransaction[]
): Array<{ category: string; total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();
  for (const tx of transactions) {
    const cat = categorizeTransaction(tx.description);
    if (cat === 'other') continue;
    const entry = map.get(cat);
    if (entry) {
      entry.total += tx.amount;
      entry.count += 1;
    } else {
      map.set(cat, { total: tx.amount, count: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export function analyzeTransactions(
  transactions: NormalizedTransaction[]
): SemanticAnalysisResult {
  return {
    outliers: detectOutliers(transactions),
    convenienceClusters: detectConvenienceClusters(transactions),
    lifeConstraints: detectLifeConstraints(transactions),
    topCategories: getTopCategories(transactions),
  };
}
