export function formatNIS(amount: number): string {
  return `₪${amount.toFixed(2)}`;
}

export function parseAmountString(str: string): number {
  // Remove currency symbols and whitespace
  let cleaned = str.replace(/[₪$€\s]/g, '');
  // Detect European format: last separator is comma (e.g. "1.234,56")
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    // European format: dots are thousands separators, comma is decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US/Israeli format: commas are thousands separators
    cleaned = cleaned.replace(/,/g, '');
  }
  cleaned = cleaned.replace(/[^\d.\-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}
