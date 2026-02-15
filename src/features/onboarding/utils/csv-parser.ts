import Papa from 'papaparse';
import type { RawCSVRow, NormalizedTransaction, ColumnMapping } from '@/src/types/csv';
import { parseAmountString } from '@/src/utils/currency';

const AMOUNT_PATTERNS = ['amount', 'sum', 'total', 'charge', 'סכום', 'חיוב', 'סה"כ'];
const DATE_PATTERNS = ['date', 'תאריך', 'תאריך עסקה', 'transaction date'];
const DESC_PATTERNS = ['description', 'merchant', 'name', 'details', 'תיאור', 'שם בית עסק', 'פירוט'];

function detectColumn(headers: string[], patterns: string[]): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern.toLowerCase()));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function autoDetectMapping(headers: string[]): ColumnMapping | null {
  const amount = detectColumn(headers, AMOUNT_PATTERNS);
  const date = detectColumn(headers, DATE_PATTERNS);
  const description = detectColumn(headers, DESC_PATTERNS);

  if (!amount || !date || !description) return null;
  return { amount, date, description };
}

export function parseCSV(content: string): Promise<{ rows: RawCSVRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve({
          rows: results.data,
          headers: results.meta.fields ?? [],
        });
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function normalizeTransactions(
  rows: RawCSVRow[],
  mapping: ColumnMapping
): NormalizedTransaction[] {
  return rows
    .map((row) => ({
      amount: parseAmountString(row[mapping.amount] ?? '0'),
      date: normalizeDate(row[mapping.date] ?? ''),
      description: (row[mapping.description] ?? '').trim(),
      originalRow: row,
    }))
    .filter((t) => t.amount > 0 && t.description.length > 0 && t.date.length > 0);
}

function normalizeDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  // Handle DD/MM/YYYY (Israeli format)
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // Handle YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return trimmed.substring(0, 10);
  // Handle "MMM DD, YYYY" or "DD MMM YYYY"
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  // Unrecognized format — return empty string to be filtered out
  return '';
}
