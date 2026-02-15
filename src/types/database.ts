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
