export function formatNIS(amount: number): string {
  return `₪${amount.toFixed(2)}`;
}

export function parseAmountString(str: string): number {
  // Remove currency symbols, commas, and whitespace
  const cleaned = str.replace(/[₪$€,\s]/g, '').replace(/[^\d.\-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}
