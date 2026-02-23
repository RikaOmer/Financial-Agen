import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  UserTraitRow,
  CategoryConfigRow,
  InterviewQueueRow,
  UserTrait,
  CategoryConfig,
  InterviewQueueItem,
} from '@/src/types/behavioral';

// --- User Traits ---

function rowToTrait(row: UserTraitRow): UserTrait {
  return {
    traitId: row.trait_id,
    score: row.score,
    lastUpdated: row.last_updated,
  };
}

export async function getAllTraits(db: SQLiteDatabase): Promise<UserTrait[]> {
  const rows = await db.getAllAsync<UserTraitRow>(
    'SELECT trait_id, score, last_updated FROM user_traits ORDER BY score DESC'
  );
  return rows.map(rowToTrait);
}

export async function getTrait(
  db: SQLiteDatabase,
  traitId: string
): Promise<UserTrait | null> {
  const row = await db.getFirstAsync<UserTraitRow>(
    'SELECT trait_id, score, last_updated FROM user_traits WHERE trait_id = ?',
    [traitId]
  );
  return row ? rowToTrait(row) : null;
}

export async function upsertTrait(
  db: SQLiteDatabase,
  traitId: string,
  score: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_traits (trait_id, score, last_updated)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(trait_id) DO UPDATE SET score = excluded.score, last_updated = excluded.last_updated`,
    [traitId, score]
  );
}

export async function getPrimaryTrait(
  db: SQLiteDatabase
): Promise<UserTrait | null> {
  const row = await db.getFirstAsync<UserTraitRow>(
    'SELECT trait_id, score, last_updated FROM user_traits ORDER BY score DESC LIMIT 1'
  );
  return row ? rowToTrait(row) : null;
}

// --- Category Config ---

function rowToConfig(row: CategoryConfigRow): CategoryConfig {
  return {
    categoryName: row.category_name,
    emotionalPriority: row.emotional_priority,
    isFunctional: row.is_functional === 1,
    notes: row.notes,
  };
}

export async function getAllCategoryConfigs(
  db: SQLiteDatabase
): Promise<CategoryConfig[]> {
  const rows = await db.getAllAsync<CategoryConfigRow>(
    'SELECT category_name, emotional_priority, is_functional, notes FROM category_config ORDER BY emotional_priority DESC'
  );
  return rows.map(rowToConfig);
}

export async function upsertCategoryConfig(
  db: SQLiteDatabase,
  categoryName: string,
  emotionalPriority: number,
  isFunctional: boolean,
  notes: string | null
): Promise<void> {
  await db.runAsync(
    `INSERT INTO category_config (category_name, emotional_priority, is_functional, notes)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(category_name) DO UPDATE SET
       emotional_priority = excluded.emotional_priority,
       is_functional = excluded.is_functional,
       notes = excluded.notes`,
    [categoryName, emotionalPriority, isFunctional ? 1 : 0, notes]
  );
}

export async function getHighPriorityCategories(
  db: SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ category_name: string }>(
    'SELECT category_name FROM category_config WHERE emotional_priority >= 7 ORDER BY emotional_priority DESC'
  );
  return rows.map((r) => r.category_name);
}

export async function getLowPriorityCategories(
  db: SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ category_name: string }>(
    'SELECT category_name FROM category_config WHERE emotional_priority <= 3 ORDER BY emotional_priority ASC'
  );
  return rows.map((r) => r.category_name);
}

// --- Interview Queue ---

function rowToQueueItem(row: InterviewQueueRow): InterviewQueueItem {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    flagReason: row.flag_reason,
    status: row.status as 'pending' | 'resolved',
  };
}

export async function getPendingInterviewItems(
  db: SQLiteDatabase
): Promise<InterviewQueueItem[]> {
  const rows = await db.getAllAsync<InterviewQueueRow>(
    `SELECT id, transaction_id, flag_reason, status FROM interview_queue WHERE status = 'pending'`
  );
  return rows.map(rowToQueueItem);
}

export async function insertInterviewItem(
  db: SQLiteDatabase,
  transactionId: number | null,
  flagReason: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO interview_queue (transaction_id, flag_reason) VALUES (?, ?)',
    [transactionId, flagReason]
  );
}

export async function resolveInterviewItem(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    `UPDATE interview_queue SET status = 'resolved' WHERE id = ?`,
    [id]
  );
}

export async function clearInterviewQueue(
  db: SQLiteDatabase
): Promise<void> {
  await db.runAsync('DELETE FROM interview_queue');
}
