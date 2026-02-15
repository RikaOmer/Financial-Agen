/** Baseline average reduction factor (target = avg * this) */
export const BASELINE_REDUCTION_FACTOR = 0.8;

/** Daily budget multiplier that triggers strict mode */
export const STRICT_MODE_THRESHOLD = 1.5;

/** Max tokens for Anthropic API calls */
export const AI_MAX_TOKENS = 1024;

/** API request timeout in milliseconds */
export const AI_TIMEOUT_MS = 30_000;

/** Minimum seconds between AI Critic calls */
export const AI_COOLDOWN_MS = 5_000;

/** Days tolerance for duplicate transaction detection */
export const DEDUP_DAYS_TOLERANCE = 2;

/** Description similarity threshold for dedup matching */
export const DEDUP_SIMILARITY_THRESHOLD = 0.5;
