import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseCSV, autoDetectMapping, normalizeTransactions } from '../utils/csv-parser';
import { filterLeisureTransactions } from '../utils/keyword-filter';
import { detectInstallments } from '../utils/installment-detector';
import { detectSubscriptions } from '../utils/subscription-detector';
import { calculateBaseline } from '../utils/baseline-calculator';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import type { ColumnMapping } from '@/src/types/csv';

type ImportStatus = 'idle' | 'picking' | 'parsing' | 'analyzing' | 'done' | 'error';

export function useCSVImport() {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [needsManualMapping, setNeedsManualMapping] = useState(false);
  const setCsvData = useOnboardingStore((s) => s.setCsvData);

  const pickAndParse = useCallback(async (manualMapping?: ColumnMapping) => {
    try {
      setError(null);

      if (!manualMapping) {
        setStatus('picking');
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/comma-separated-values', 'application/*'],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          setStatus('idle');
          return;
        }

        const fileUri = result.assets[0].uri;
        setStatus('parsing');
        const content = await FileSystem.readAsStringAsync(fileUri);

        const { rows, headers: csvHeaders } = await parseCSV(content);
        setHeaders(csvHeaders);

        const mapping = autoDetectMapping(csvHeaders);
        if (!mapping) {
          setNeedsManualMapping(true);
          setStatus('idle');
          return;
        }

        await analyze(rows, mapping);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
      setStatus('error');
    }
  }, []);

  const applyManualMapping = useCallback(
    async (mapping: ColumnMapping, content: string) => {
      try {
        setStatus('parsing');
        const { rows } = await parseCSV(content);
        await analyze(rows, mapping);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setStatus('error');
      }
    },
    []
  );

  async function analyze(rows: Record<string, string>[], mapping: ColumnMapping) {
    setStatus('analyzing');
    const normalized = normalizeTransactions(rows, mapping);
    const { leisure, unrecognized } = filterLeisureTransactions(normalized);
    const installments = detectInstallments(normalized);
    const subscriptions = detectSubscriptions(leisure);
    const allCommitments = [...installments, ...subscriptions];
    const { baselineAvg, proposedTarget } = calculateBaseline(leisure);

    setCsvData({
      transactions: leisure,
      commitments: allCommitments,
      unrecognized,
      baselineAvg,
      proposedTarget,
    });

    setStatus('done');
  }

  return {
    status,
    error,
    headers,
    needsManualMapping,
    pickAndParse,
    applyManualMapping,
  };
}
