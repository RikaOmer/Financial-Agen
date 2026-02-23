export interface Commitment {
  id: number;
  name: string;
  amount: number;
  type: 'subscription' | 'installment';
  total_installments: number | null;
  remaining_installments: number | null;
  end_date: string | null;
  category: string;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: string;
  timestamp: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface UserTraitRow {
  trait_id: string;
  score: number;
  last_updated: string;
}

export interface CategoryConfigRow {
  category_name: string;
  emotional_priority: number;
  is_functional: number;
  notes: string | null;
}

export interface InterviewQueueRow {
  id: number;
  transaction_id: number | null;
  flag_reason: string;
  status: string;
}
