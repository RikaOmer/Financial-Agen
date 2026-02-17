export interface RawCSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  amount: string;
  date: string;
  description: string;
  /** Optional secondary column (e.g. פירוט) appended to description for installment detection */
  details?: string;
}

export interface NormalizedTransaction {
  amount: number;
  date: string;
  description: string;
  originalRow: RawCSVRow;
}

export interface DetectedCommitment {
  name: string;
  amount: number;
  type: 'subscription' | 'installment';
  total_installments: number | null;
  remaining_installments: number | null;
  end_date: string | null;
  category: string;
  selected: boolean;
}

export interface CSVParseResult {
  transactions: NormalizedTransaction[];
  commitments: DetectedCommitment[];
  unrecognized: NormalizedTransaction[];
  baselineAvg: number;
  proposedTarget: number;
}
