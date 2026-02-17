import * as XLSX from 'xlsx';
import type { RawCSVRow } from '@/src/types/csv';

const HEADER_KEYWORDS = [
  'amount', 'sum', 'total', 'charge', 'date', 'description', 'merchant', 'name', 'details',
  'transaction date',
  'סכום', 'חיוב', 'סה"כ', 'תאריך', 'תאריך עסקה', 'תיאור', 'שם בית העסק', 'שם בית עסק', 'שם העסק', 'פירוט',
];

/** Scan first 20 rows for the one most likely to be the header (Israeli bank exports often have metadata rows above). */
function findHeaderRowIndex(data: string[][]): number {
  let bestIndex = 0;
  let bestScore = 0;

  const limit = Math.min(data.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    const score = row.filter((cell) => {
      const lower = String(cell).toLowerCase().trim();
      return HEADER_KEYWORDS.some((kw) => lower.includes(kw));
    }).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function parseExcel(base64Content: string): { rows: RawCSVRow[]; headers: string[] } {
  const workbook = XLSX.read(base64Content, {
    type: 'base64',
    cellDates: true,
    dateNF: 'dd/mm/yyyy',
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel file contains no sheets.');

  const sheet = workbook.Sheets[sheetName];
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    rawNumbers: false,
  });

  if (raw.length < 2) throw new Error('Excel file has no data rows.');

  const headerIdx = findHeaderRowIndex(raw);
  const rawHeaders = raw[headerIdx].map((h) => String(h).trim());

  // Deduplicate headers: append _2, _3, etc. for repeats; name empty columns Column_N
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h, i) => {
    const name = h || `Column_${i + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count > 0 ? `${name}_${count + 1}` : name;
  });

  const rows: RawCSVRow[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i];
    if (!rowArr || rowArr.every((c) => String(c).trim() === '')) continue;
    const obj: RawCSVRow = {};
    headers.forEach((h, idx) => {
      obj[h] = String(rowArr[idx] ?? '').trim();
    });
    rows.push(obj);
  }

  return { rows, headers };
}
