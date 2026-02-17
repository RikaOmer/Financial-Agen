/**
 * End-to-end test of the import pipeline using real files from Data/.
 * Mirrors the app flow: parse → autoDetect → normalize → filter → detect → baseline.
 * Run: node test-import.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'Data');
const OUTPUT_FILE = path.join(__dirname, 'test-output.txt');

// ─── Inline the app logic (no TS, no path aliases) ───

const NON_LEISURE_KEYWORDS = [
  'electric', 'electricity', 'rent', 'tax', 'mortgage', 'insurance',
  'water', 'gas', 'salary', 'payroll', 'transfer', 'atm', 'withdrawal',
  'deposit', 'refund', 'municipal', 'government', 'health', 'medical',
  'pharmacy', 'doctor', 'hospital', 'school', 'tuition', 'daycare',
  'kindergarten', 'parking fine', 'court', 'lawyer',
  'חשמל', 'שכירות', 'שכ"ד', 'ארנונה', 'מס', 'מיסים', 'ביטוח',
  'משכנתא', 'מים', 'גז', 'משכורת', 'העברה', 'כספומט', 'משיכה',
  'הפקדה', 'החזר', 'עירייה', 'ממשלת', 'קופת חולים', 'בית חולים',
  'רופא', 'בית מרקחת', 'גן ילדים', 'בית ספר', 'שכר לימוד',
  'ועד בית', 'חניה', 'קנס',
];

function isNonLeisure(description) {
  const lower = description.toLowerCase();
  return NON_LEISURE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

const LEISURE_CATEGORIES = {
  food_dining: { label: 'Food & Dining', keywords: ['restaurant','cafe','coffee','pizza','burger','sushi','bar','pub','bakery','food','delivery','wolt','japanika','10bis','מסעדה','בית קפה','קפה','פיצה','בורגר','סושי','משלוח','אוכל','מאפייה'] },
  entertainment: { label: 'Entertainment', keywords: ['cinema','movie','theater','concert','show','netflix','spotify','disney','hbo','apple tv','youtube','gaming','steam','playstation','xbox','nintendo','yes','hot','קולנוע','סרט','תיאטרון','הופעה','מופע'] },
  shopping: { label: 'Shopping', keywords: ['amazon','aliexpress','shein','zara','h&m','clothing','shoes','fashion','mall','store','shop','purchase','asos','קניון','חנות','ביגוד','נעליים','אופנה'] },
  fitness: { label: 'Fitness & Wellness', keywords: ['gym','fitness','yoga','pilates','spa','massage','sport','pool','swimming','חדר כושר','יוגה','ספא','עיסוי','בריכה','שחייה'] },
  transport_leisure: { label: 'Leisure Transport', keywords: ['uber','gett','bolt','taxi','yango','מונית','הסעה'] },
  subscriptions: { label: 'Subscriptions', keywords: ['subscription','monthly','membership','premium','מנוי','חברות'] },
  hobbies: { label: 'Hobbies', keywords: ['book','music','art','craft','photography','course','class','ספר','מוזיקה','אומנות','קורס','שיעור'] },
  other: { label: 'Other', keywords: [] },
};

function categorizeTransaction(description) {
  const lower = description.toLowerCase();
  for (const [key, config] of Object.entries(LEISURE_CATEGORIES)) {
    if (key === 'other') continue;
    if (config.keywords.some(kw => lower.includes(kw.toLowerCase()))) return key;
  }
  return 'other';
}

function filterLeisureTransactions(transactions) {
  const leisure = [];
  const unrecognized = [];
  for (const tx of transactions) {
    if (isNonLeisure(tx.description)) continue;
    const category = categorizeTransaction(tx.description);
    if (category === 'other') unrecognized.push(tx);
    else leisure.push(tx);
  }
  return { leisure, unrecognized };
}

const INSTALLMENT_PATTERNS = [
  /(\d+)\s*(?:of|\/)\s*(\d+)/i,
  /תשלום\s*(\d+)\s*מתוך\s*(\d+)/,
  /(\d+)\s*[/]\s*(\d+)\s*תשלומים/,
  /תש\s*(\d+)[/](\d+)/,
];

function detectInstallments(transactions) {
  const commitments = [];
  const seen = new Set();
  for (const tx of transactions) {
    for (const pattern of INSTALLMENT_PATTERNS) {
      const match = tx.description.match(pattern);
      if (match) {
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        if (total <= 0 || current <= 0 || current > total) continue;
        const name = tx.description.replace(pattern, '').trim() || tx.description;
        const key = `${name}-${tx.amount}-${total}`;
        if (seen.has(key)) continue;
        seen.add(key);
        commitments.push({ name, amount: tx.amount, type: 'installment', total, remaining: total - current, category: categorizeTransaction(name) });
        break;
      }
    }
  }
  return commitments;
}

function detectSubscriptions(transactions) {
  const groups = new Map();
  for (const tx of transactions) {
    const normalized = tx.description.toLowerCase().replace(/\d+/g, '').replace(/[^\w\sא-ת]/g, '').trim();
    const key = `${normalized}|${tx.amount.toFixed(2)}`;
    const existing = groups.get(key);
    if (existing) { existing.dates.push(tx.date); }
    else { groups.set(key, { name: tx.description, amount: tx.amount, dates: [tx.date] }); }
  }
  const commitments = [];
  for (const [, group] of groups) {
    const months = new Set(group.dates.map(d => d.substring(0, 7)));
    if (months.size >= 2) {
      commitments.push({ name: group.name, amount: group.amount, type: 'subscription', category: categorizeTransaction(group.name) });
    }
  }
  return commitments;
}

const BASELINE_REDUCTION_FACTOR = 0.8;
function calculateBaseline(transactions) {
  if (transactions.length === 0) return { baselineAvg: 0, proposedTarget: 0 };
  const monthlyTotals = new Map();
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7);
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + tx.amount);
  }
  if (monthlyTotals.size === 0) return { baselineAvg: 0, proposedTarget: 0 };
  const totals = Array.from(monthlyTotals.values());
  const baselineAvg = totals.reduce((s, v) => s + v, 0) / totals.length;
  return { baselineAvg: Math.round(baselineAvg), proposedTarget: Math.round(baselineAvg * BASELINE_REDUCTION_FACTOR) };
}

function parseAmountString(str) {
  let cleaned = str.replace(/[₪$€\s]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  cleaned = cleaned.replace(/[^\d.\-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

function normalizeDate(dateStr) {
  const trimmed = dateStr.trim();
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return trimmed.substring(0, 10);
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return '';
}

// ─── Column detection (same as csv-parser.ts) ───
const AMOUNT_PATTERNS = ['amount', 'sum', 'total', 'charge', 'סכום חיוב', 'חיוב', 'סכום', 'סה"כ'];
const DATE_PATTERNS = ['date', 'תאריך', 'תאריך עסקה', 'transaction date'];
const DESC_PATTERNS = ['description', 'merchant', 'name', 'תיאור', 'שם בית העסק', 'שם בית עסק', 'שם העסק', 'פירוט', 'details'];
const DETAILS_PATTERNS = ['פירוט', 'details', 'הערות'];

function detectColumn(headers, patterns) {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern.toLowerCase()));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function autoDetectMapping(headers) {
  const amount = detectColumn(headers, AMOUNT_PATTERNS);
  const date = detectColumn(headers, DATE_PATTERNS);
  const description = detectColumn(headers, DESC_PATTERNS);
  if (!amount || !date || !description) return null;
  let details;
  const detailsCol = detectColumn(headers, DETAILS_PATTERNS);
  if (detailsCol && detailsCol !== description) details = detailsCol;
  return { amount, date, description, details };
}

function normalizeTransactions(rows, mapping) {
  return rows
    .map(row => {
      const desc = (row[mapping.description] ?? '').trim();
      const details = mapping.details ? (row[mapping.details] ?? '').trim() : '';
      const description = details && details !== desc ? `${desc} ${details}` : desc;
      return {
        amount: parseAmountString(row[mapping.amount] ?? '0'),
        date: normalizeDate(row[mapping.date] ?? ''),
        description,
        originalRow: row,
      };
    })
    .filter(t => t.amount > 0 && t.description.length > 0 && t.date.length > 0);
}

// ─── Excel parser (mirrors excel-parser.ts) ───
const HEADER_KEYWORDS = [
  'amount','sum','total','charge','date','description','merchant','name','details','transaction date',
  'סכום','חיוב','סה"כ','תאריך','תאריך עסקה','תיאור','שם בית העסק','שם בית עסק','שם העסק','פירוט',
];

function findHeaderRowIndex(data) {
  let bestIndex = 0;
  let bestScore = 0;
  const limit = Math.min(data.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    const score = row.filter(cell => {
      const lower = String(cell).toLowerCase().trim();
      return HEADER_KEYWORDS.some(kw => lower.includes(kw));
    }).length;
    if (score > bestScore) { bestScore = score; bestIndex = i; }
  }
  return bestIndex;
}

function parseExcel(filePath) {
  const buf = fs.readFileSync(filePath);
  const base64 = buf.toString('base64');
  const workbook = XLSX.read(base64, { type: 'base64', cellDates: true, dateNF: 'dd/mm/yyyy' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets');
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', rawNumbers: false });
  if (raw.length < 2) throw new Error('No data rows');

  const headerIdx = findHeaderRowIndex(raw);
  const rawHeaders = raw[headerIdx].map(h => String(h).trim());

  const seen = new Map();
  const headers = rawHeaders.map((h, i) => {
    const name = h || `Column_${i + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count > 0 ? `${name}_${count + 1}` : name;
  });

  const rows = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i];
    if (!rowArr || rowArr.every(c => String(c).trim() === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = String(rowArr[idx] ?? '').trim(); });
    rows.push(obj);
  }
  return { rows, headers };
}

function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return { rows: result.data, headers: result.meta.fields ?? [] };
}

// ─── Run tests ───

const out = [];
function log(msg = '') { out.push(msg); }
function logSep() { log('─'.repeat(80)); }

const files = fs.readdirSync(DATA_DIR).sort();
log('╔══════════════════════════════════════════════════════════════════════════════╗');
log('║           IMPORT PIPELINE TEST — All files in Data/                         ║');
log('╚══════════════════════════════════════════════════════════════════════════════╝');
log(`Date: ${new Date().toISOString()}`);
log(`Files found: ${files.length}`);
logSep();

const allNormalized = [];
const perFileResults = [];
let totalParsed = 0;
let totalFailed = 0;

for (const fileName of files) {
  const filePath = path.join(DATA_DIR, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const isExcel = ext === '.xlsx' || ext === '.xls';

  log(`\n▶ FILE: ${fileName}`);
  log(`  Type: ${isExcel ? 'Excel' : 'CSV'} (${ext})`);

  try {
    // Step 1: Parse
    const { rows, headers } = isExcel ? parseExcel(filePath) : parseCSVFile(filePath);
    log(`  Parsed: ${rows.length} rows, ${headers.length} columns`);
    log(`  Headers: [${headers.join(', ')}]`);

    // Step 2: Auto-detect mapping
    const mapping = autoDetectMapping(headers);
    if (!mapping) {
      log(`  ❌ AUTO-DETECT FAILED — no matching columns found`);
      log(`     (Would trigger manual mapping UI in the app)`);
      totalFailed++;
      perFileResults.push({ file: fileName, status: 'MAPPING_FAILED', rows: rows.length });
      continue;
    }
    log(`  Mapping: amount="${mapping.amount}", date="${mapping.date}", description="${mapping.description}"${mapping.details ? `, details="${mapping.details}"` : ''}`);

    // Step 3: Normalize
    const normalized = normalizeTransactions(rows, mapping);
    log(`  Normalized: ${normalized.length} valid transactions (from ${rows.length} rows)`);

    if (normalized.length === 0) {
      log(`  ⚠ No valid transactions after normalization`);
      perFileResults.push({ file: fileName, status: 'NO_VALID_TX', rows: rows.length });
      totalFailed++;
      continue;
    }

    // Show sample transactions
    log(`  Sample transactions (first 3):`);
    for (const tx of normalized.slice(0, 3)) {
      log(`    ${tx.date}  ₪${tx.amount.toFixed(2).padStart(8)}  ${tx.description.substring(0, 60)}`);
    }

    // Step 4: Filter leisure
    const { leisure, unrecognized } = filterLeisureTransactions(normalized);
    const filtered = normalized.length - leisure.length - unrecognized.length;
    log(`  Filter: ${leisure.length} leisure, ${unrecognized.length} unrecognized, ${filtered} non-leisure filtered`);

    // Step 5: Detect commitments
    const installments = detectInstallments(normalized);
    const subscriptions = detectSubscriptions(leisure);
    log(`  Commitments: ${installments.length} installments, ${subscriptions.length} subscriptions`);

    if (installments.length > 0) {
      for (const inst of installments.slice(0, 3)) {
        log(`    [INSTALLMENT] ${inst.name.substring(0, 40)} — ₪${inst.amount.toFixed(2)}, ${inst.remaining} remaining of ${inst.total}`);
      }
    }
    if (subscriptions.length > 0) {
      for (const sub of subscriptions.slice(0, 3)) {
        log(`    [SUBSCRIPTION] ${sub.name.substring(0, 40)} — ₪${sub.amount.toFixed(2)}`);
      }
    }

    // Step 6: Baseline
    const { baselineAvg, proposedTarget } = calculateBaseline(leisure);
    log(`  Baseline: avg ₪${baselineAvg}/month → proposed target ₪${proposedTarget}/month`);

    // Date range
    const dates = normalized.map(tx => tx.date).sort();
    log(`  Date range: ${dates[0]} to ${dates[dates.length - 1]}`);

    allNormalized.push(...normalized);
    totalParsed++;
    perFileResults.push({
      file: fileName, status: 'OK', rows: rows.length,
      normalized: normalized.length, leisure: leisure.length,
      unrecognized: unrecognized.length,
      installments: installments.length, subscriptions: subscriptions.length,
      baselineAvg, proposedTarget,
    });

    log(`  ✅ OK`);
  } catch (err) {
    log(`  ❌ ERROR: ${err.message}`);
    totalFailed++;
    perFileResults.push({ file: fileName, status: 'ERROR', error: err.message });
  }
}

// ─── Multi-file merge simulation ───
logSep();
log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
log('║           MULTI-FILE MERGE SIMULATION (all files combined)                  ║');
log('╚══════════════════════════════════════════════════════════════════════════════╝');
log(`Total normalized transactions before dedup: ${allNormalized.length}`);

// Cross-file dedup
const seen = new Set();
const deduped = allNormalized.filter(tx => {
  const key = `${tx.description}|${tx.amount}|${tx.date}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
log(`After cross-file dedup: ${deduped.length} unique (${allNormalized.length - deduped.length} duplicates removed)`);

// Full pipeline on merged
const { leisure: mergedLeisure, unrecognized: mergedUnrecognized } = filterLeisureTransactions(deduped);
const mergedFiltered = deduped.length - mergedLeisure.length - mergedUnrecognized.length;
const mergedInstallments = detectInstallments(deduped);
const mergedSubscriptions = detectSubscriptions(mergedLeisure);
const { baselineAvg: mergedBaseline, proposedTarget: mergedTarget } = calculateBaseline(mergedLeisure);

log(`\nMerged Results:`);
log(`  Leisure transactions: ${mergedLeisure.length}`);
log(`  Unrecognized: ${mergedUnrecognized.length}`);
log(`  Non-leisure filtered: ${mergedFiltered}`);
log(`  Installments: ${mergedInstallments.length}`);
log(`  Subscriptions: ${mergedSubscriptions.length}`);
log(`  Baseline avg: ₪${mergedBaseline}/month`);
log(`  Proposed target: ₪${mergedTarget}/month`);

// Category breakdown
const catCount = {};
for (const tx of mergedLeisure) {
  const cat = categorizeTransaction(tx.description);
  catCount[cat] = (catCount[cat] ?? 0) + 1;
}
log(`\n  Category breakdown:`);
for (const [cat, count] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
  const label = LEISURE_CATEGORIES[cat]?.label ?? cat;
  log(`    ${label}: ${count} transactions`);
}

// Monthly breakdown
const monthTotals = new Map();
for (const tx of deduped) {
  const m = tx.date.substring(0, 7);
  monthTotals.set(m, (monthTotals.get(m) ?? 0) + tx.amount);
}
log(`\n  Monthly totals (all transactions):`);
for (const [month, total] of [...monthTotals.entries()].sort()) {
  log(`    ${month}: ₪${total.toFixed(2)}`);
}

if (mergedInstallments.length > 0) {
  log(`\n  All installments:`);
  for (const inst of mergedInstallments) {
    log(`    ${inst.name.substring(0, 50)} — ₪${inst.amount.toFixed(2)}, ${inst.remaining}/${inst.total} remaining`);
  }
}
if (mergedSubscriptions.length > 0) {
  log(`\n  All subscriptions:`);
  for (const sub of mergedSubscriptions) {
    log(`    ${sub.name.substring(0, 50)} — ₪${sub.amount.toFixed(2)}/month`);
  }
}

// Merchant grouping (simulates the new grouped classification modal)
const merchantMap = new Map();
for (const tx of mergedUnrecognized) {
  const key = tx.description.trim().toLowerCase();
  const arr = merchantMap.get(key);
  if (arr) arr.push(tx);
  else merchantMap.set(key, [tx]);
}
const merchantGroups = Array.from(merchantMap.values()).map(txs => ({
  name: txs[0].description,
  count: txs.length,
  total: txs.reduce((s, t) => s + t.amount, 0),
})).sort((a, b) => b.count - a.count);

log(`\n  ⭐ MERCHANT GROUPING (what the user actually sees):`);
log(`  Before: ${mergedUnrecognized.length} individual items to classify`);
log(`  After:  ${merchantGroups.length} unique merchants to classify`);
log(`  Reduction: ${mergedUnrecognized.length - merchantGroups.length} fewer taps (${Math.round((1 - merchantGroups.length / mergedUnrecognized.length) * 100)}% less)`);
log('');
for (const g of merchantGroups) {
  log(`    ${g.name.substring(0, 45).padEnd(45)}  ${String(g.count).padStart(2)}x  ₪${g.total.toFixed(2).padStart(9)}`);
}

// ─── Summary table ───
logSep();
log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
log('║                            SUMMARY TABLE                                    ║');
log('╚══════════════════════════════════════════════════════════════════════════════╝');
log(`${'File'.padEnd(55)} ${'Status'.padEnd(15)} ${'Rows'.padStart(5)} ${'Norm'.padStart(5)} ${'Leis'.padStart(5)}`);
log('─'.repeat(90));
for (const r of perFileResults) {
  const name = r.file.length > 53 ? r.file.substring(0, 50) + '...' : r.file;
  log(`${name.padEnd(55)} ${r.status.padEnd(15)} ${String(r.rows ?? '-').padStart(5)} ${String(r.normalized ?? '-').padStart(5)} ${String(r.leisure ?? '-').padStart(5)}`);
}
log('─'.repeat(90));
log(`Total: ${totalParsed} parsed, ${totalFailed} failed, ${files.length} files`);

// Write output
fs.writeFileSync(OUTPUT_FILE, out.join('\n'), 'utf-8');
console.log(`Done! Output written to ${OUTPUT_FILE}`);
console.log(`${totalParsed}/${files.length} files parsed successfully.`);
