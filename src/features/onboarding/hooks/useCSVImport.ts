import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { autoDetectMapping, normalizeTransactions } from '../utils/csv-parser';
import { detectFileType, parseFile } from '../utils/file-parser';
import { filterLeisureTransactions } from '../utils/keyword-filter';
import { detectInstallments } from '../utils/installment-detector';
import { detectSubscriptions } from '../utils/subscription-detector';
import { calculateBaseline } from '../utils/baseline-calculator';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import type { ColumnMapping, NormalizedTransaction } from '@/src/types/csv';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getTransactionsForMonth } from '@/src/core/db/queries/transactions';
import { findDuplicates } from '@/src/features/budget/utils/deduplication';
import type { DuplicateMatch } from '@/src/features/budget/utils/deduplication';
import type { Transaction } from '@/src/types/database';

type ImportStatus = 'idle' | 'picking' | 'parsing' | 'analyzing' | 'dedup_review' | 'done' | 'error';

export function useCSVImport(db?: SQLiteDatabase) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [needsManualMapping, setNeedsManualMapping] = useState(false);
  const [storedRows, setStoredRows] = useState<Record<string, string>[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [parseProgress, setParseProgress] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<{ leisure: NormalizedTransaction[]; unrecognized: NormalizedTransaction[]; allCommitments: any[]; baselineAvg: number; proposedTarget: number } | null>(null);
  const setCsvData = useOnboardingStore((s) => s.setCsvData);

  const pickAndParse = useCallback(async (manualMapping?: ColumnMapping) => {
    try {
      setError(null);

      if (manualMapping) {
        await analyze(storedRows, manualMapping);
        setNeedsManualMapping(false);
        return;
      }

      setStatus('picking');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        setStatus('idle');
        return;
      }

      const files = result.assets;

      // Single file — use original flow (supports manual mapping fallback)
      if (files.length === 1) {
        const file = files[0];
        const fileUri = file.uri;
        const fileName = (file.name ?? fileUri).toLowerCase();
        const fileType = detectFileType(fileName);

        setStatus('parsing');
        setParseProgress('');
        const content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: fileType === 'excel'
            ? FileSystem.EncodingType.Base64
            : FileSystem.EncodingType.UTF8,
        });

        const { rows, headers: csvHeaders } = await parseFile(content, fileType);
        setHeaders(csvHeaders);
        setStoredRows(rows);

        const mapping = autoDetectMapping(csvHeaders);
        if (!mapping) {
          setNeedsManualMapping(true);
          setStatus('idle');
          return;
        }

        await analyze(rows, mapping);
        return;
      }

      // Multiple files — parse each independently, merge normalized transactions
      setStatus('parsing');
      const allNormalized: NormalizedTransaction[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name ?? `file_${i + 1}`;
        setParseProgress(`Parsing file ${i + 1} of ${files.length}: ${fileName}`);

        try {
          const fileType = detectFileType(fileName.toLowerCase());
          const content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: fileType === 'excel'
              ? FileSystem.EncodingType.Base64
              : FileSystem.EncodingType.UTF8,
          });

          const { rows, headers: fileHeaders } = await parseFile(content, fileType);
          const mapping = autoDetectMapping(fileHeaders);

          if (!mapping) {
            failedFiles.push(fileName);
            continue;
          }

          const normalized = normalizeTransactions(rows, mapping);
          allNormalized.push(...normalized);
        } catch {
          failedFiles.push(fileName);
        }
      }

      setParseProgress('');

      if (allNormalized.length === 0) {
        throw new Error(
          failedFiles.length > 0
            ? `Could not detect columns in any of the ${files.length} files. Try importing a single file and mapping columns manually.`
            : 'No transactions found in the selected files.'
        );
      }

      // Deduplicate across files (same description + amount + date)
      const seen = new Set<string>();
      const deduped = allNormalized.filter((tx) => {
        const key = `${tx.description}|${tx.amount}|${tx.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const warningPrefix = failedFiles.length > 0
        ? `Note: ${failedFiles.length} file(s) skipped (couldn't detect columns): ${failedFiles.join(', ')}. `
        : '';

      if (warningPrefix) {
        setError(warningPrefix);
      }

      await analyzeNormalized(deduped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
      setStatus('error');
    }
  }, [storedRows]);

  const applyManualMapping = useCallback(
    async (mapping: ColumnMapping, content: string) => {
      try {
        setStatus('parsing');
        const fileType = detectFileType(content.startsWith('PK') ? 'file.xlsx' : 'file.csv');
        const { rows } = await parseFile(content, fileType);
        await analyze(rows, mapping);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
        setStatus('error');
      }
    },
    []
  );

  async function analyze(rows: Record<string, string>[], mapping: ColumnMapping) {
    setStatus('analyzing');
    const normalized = normalizeTransactions(rows, mapping);
    await analyzeNormalized(normalized);
  }

  async function analyzeNormalized(normalized: NormalizedTransaction[]) {
    setStatus('analyzing');
    const { leisure, unrecognized } = filterLeisureTransactions(normalized);
    const installments = detectInstallments(normalized);
    const subscriptions = detectSubscriptions(leisure);
    const allCommitments = [...installments, ...subscriptions];
    const { baselineAvg, proposedTarget } = calculateBaseline(leisure);

    // Check for duplicates if db is available
    if (db) {
      const now = new Date();
      const existingTxns: Transaction[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const txns = await getTransactionsForMonth(db, d.getFullYear(), d.getMonth() + 1);
        existingTxns.push(...txns);
      }
      if (existingTxns.length > 0) {
        const matches = findDuplicates(existingTxns, leisure);
        if (matches.length > 0) {
          setDuplicates(matches);
          setPendingAnalysis({ leisure, unrecognized, allCommitments, baselineAvg, proposedTarget });
          setStatus('dedup_review');
          return;
        }
      }
    }

    setCsvData({
      transactions: leisure,
      commitments: allCommitments,
      unrecognized,
      baselineAvg,
      proposedTarget,
    });

    setStatus('done');
  }

  const finalizeDedup = useCallback((excludedIndices: Set<number>) => {
    if (!pendingAnalysis) return;
    const { leisure, unrecognized, allCommitments, baselineAvg, proposedTarget } = pendingAnalysis;

    // Get the CSV entries from duplicate matches that should be excluded
    const excludedDescriptions = new Set(
      duplicates
        .filter((_, i) => excludedIndices.has(i))
        .map(d => `${d.csvEntry.description}|${d.csvEntry.amount}|${d.csvEntry.date}`)
    );

    const filteredLeisure = leisure.filter(tx =>
      !excludedDescriptions.has(`${tx.description}|${tx.amount}|${tx.date}`)
    );

    setCsvData({
      transactions: filteredLeisure,
      commitments: allCommitments,
      unrecognized,
      baselineAvg,
      proposedTarget,
    });

    setDuplicates([]);
    setPendingAnalysis(null);
    setStatus('done');
  }, [pendingAnalysis, duplicates, setCsvData]);

  return {
    status,
    error,
    headers,
    needsManualMapping,
    pickAndParse,
    applyManualMapping,
    duplicates,
    finalizeDedup,
    parseProgress,
  };
}
