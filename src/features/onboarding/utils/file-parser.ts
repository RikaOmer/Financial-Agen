import { parseCSV } from './csv-parser';
import { parseExcel } from './excel-parser';
import type { RawCSVRow } from '@/src/types/csv';

export type FileType = 'csv' | 'excel';

export function detectFileType(fileName: string): FileType {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel';
  return 'csv';
}

export async function parseFile(
  content: string,
  fileType: FileType
): Promise<{ rows: RawCSVRow[]; headers: string[] }> {
  if (fileType === 'excel') {
    return parseExcel(content);
  }

  // Guard against binary Excel content picked via generic MIME type
  if (content.startsWith('PK')) {
    throw new Error('This file appears to be an Excel file. Please rename it with an .xlsx extension and try again.');
  }

  return parseCSV(content);
}
