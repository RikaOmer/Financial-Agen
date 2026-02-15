# Financial Digital Twin — Bug & Fix Report

Comprehensive list of all bugs, issues, and required fixes identified through architecture audit, code analysis, feature verification, and improvement review.

---

## CRITICAL BUGS

### BUG-001: Installment Remaining Count Off-by-One
- **File:** `src/features/onboarding/utils/installment-detector.ts:36`
- **Problem:** `remaining = total - current + 1` adds a phantom extra installment. If user is on payment 3 of 12, this calculates 10 remaining instead of 9.
- **Impact:** Every detected installment gets one extra month of charges, inflating commitment totals and reducing daily budget incorrectly.
- **Fix:** Change to `const remaining = total - current;`

### BUG-002: Alert Shows Stale Budget After Adding Expense
- **File:** `app/(tabs)/add-expense.tsx:51`
- **Problem:** The success alert uses `dailyBudget` from the Zustand snapshot captured at render time, but `refreshBudget(db)` is async and hasn't completed yet when the alert fires.
- **Impact:** User sees incorrect "New daily budget" value in the confirmation alert.
- **Fix:** Await `refreshBudget(db)`, then read the updated snapshot from the store before showing the alert.

### BUG-003: Same Stale Alert in AI Critic "Buy Anyway"
- **File:** `app/(tabs)/ask-critic.tsx:42-49`
- **Problem:** Same pattern as BUG-002. `insertTransaction` + `refreshBudget` called, but alert fires before refresh completes.
- **Impact:** "Recorded" alert may show stale budget info.
- **Fix:** Await `refreshBudget(db)`, then show alert with fresh values.

### BUG-004: No Timeout on Anthropic API Calls
- **File:** `src/features/agent/utils/anthropic-client.ts`
- **Problem:** `fetch()` call has no `AbortController` or timeout. If the Anthropic API is slow or unreachable, the request hangs indefinitely with a spinner.
- **Impact:** User stuck on "The Critic is thinking..." forever with no way to cancel.
- **Fix:** Add `AbortController` with a 30-second timeout:
  ```typescript
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(API_URL, { ...options, signal: controller.signal });
  clearTimeout(timeout);
  ```

### BUG-005: API Key Not Loaded on App Startup
- **File:** `app/_layout.tsx` (missing), `src/stores/settings-store.ts`
- **Problem:** `loadApiKey()` is only called when the Settings screen mounts. If the user goes to "Ask Critic" first, `apiKey` is null in Zustand, and the critic silently falls back to offline heuristics without telling the user their key exists but wasn't loaded.
- **Impact:** AI Critic appears broken (gives low-confidence offline verdicts) until user visits Settings tab.
- **Fix:** Call `useSettingsStore.getState().loadApiKey()` in a startup component inside `_layout.tsx` after SQLiteProvider is ready.

---

## MAJOR BUGS

### BUG-006: Settings Store Not Hydrated from Database on Restart
- **File:** `src/stores/settings-store.ts`
- **Problem:** Zustand store fields (`monthlyTarget`, `savingsGoalName`, `savingsGoalAmount`) start at 0/"" and are never loaded from SQLite on app launch. Only `apiKey` has a `loadApiKey()` method. Screens that read from the store (not directly from DB) get stale/zero values.
- **Impact:** Budget calculations using store values may be wrong until user visits Settings. Dashboard stats could show 0 for monthly target.
- **Fix:** Add `hydrateFromDB(db)` method to settings store that loads all persisted settings from SQLite. Call it on app startup alongside `loadApiKey()`.

### BUG-007: Date Parsing Fallback Returns Malformed Strings
- **File:** `src/features/onboarding/utils/csv-parser.ts:69`
- **Problem:** If a date string doesn't match DD/MM/YYYY or YYYY-MM-DD patterns, the raw string is returned as-is (e.g., "Feb 15, 2026" or "15-Feb-2026"). This breaks `baseline-calculator.ts` which groups by `date.substring(0, 7)` expecting YYYY-MM format.
- **Impact:** Transactions with unrecognized date formats get grouped incorrectly, corrupting baseline average calculation.
- **Fix:** Add more date format patterns (e.g., "MMM DD, YYYY"), or return empty string / throw for unrecognized formats so they can be flagged to the user.

### BUG-008: Manual CSV Column Mapping Never Exposed to User
- **File:** `src/features/onboarding/hooks/useCSVImport.ts`, `app/(onboarding)/csv-upload.tsx`
- **Problem:** When `autoDetectMapping()` returns null (can't find amount/date/description columns), the hook sets `needsManualMapping = true` and `status = 'idle'`. But `csv-upload.tsx` never checks `needsManualMapping` and shows no UI for manual column selection.
- **Impact:** User is stuck — CSV imported but no data appears, no error shown, no way to proceed.
- **Fix:** Add a column mapping UI in `csv-upload.tsx` that shows when `needsManualMapping` is true, letting the user pick which CSV columns map to amount, date, and description.

### BUG-009: Silent Budget Refresh Failures
- **File:** `src/stores/budget-store.ts:95-96`
- **Problem:** The catch block in `refreshBudget()` only sets `isLoading: false` — no error is captured, logged, or displayed.
- **Impact:** If any DB query fails during budget calculation, the snapshot stays stale with no indication to the user.
- **Fix:** Add an `error` field to the store, set it in the catch block, and display it in the dashboard UI.

### BUG-010: Big Events JSON Parse Without Try-Catch
- **File:** `src/stores/budget-store.ts:52`
- **Problem:** `JSON.parse(bigEventsJson)` called without error handling. If the `big_events` setting contains malformed JSON (e.g., from a partial write), the entire `refreshBudget()` call crashes.
- **Impact:** App shows stale budget data or crashes on startup if big_events setting is corrupted.
- **Fix:** Wrap in try-catch, default to empty array on parse failure:
  ```typescript
  let bigEvents: BigEvent[] = [];
  try { bigEvents = JSON.parse(bigEventsJson); } catch { /* default empty */ }
  ```

### BUG-011: Month Transition Runs Installment Decrement on First Launch
- **File:** `src/features/budget/utils/month-transition.ts:16-24`
- **Problem:** On first app launch, `lastActive` is null. The function skips `processMonthEnd` (correct), but still calls `decrementInstallments()` and `deleteCompletedInstallments()`. If user just finished onboarding and added installments, they immediately lose one month of remaining count.
- **Impact:** Newly imported installments start with one fewer remaining payment than expected.
- **Fix:** Guard decrement/delete behind `if (lastActive)` so they only run on actual month transitions, not first launch.

### BUG-012: Commitment Delete Race Condition
- **File:** `app/(tabs)/commitments.tsx:77-90`
- **Problem:** `deleteCommitment`, `load()`, and `refreshBudget()` are called in sequence but the promise chain isn't properly awaited in the `onPress` callback:
  ```typescript
  onPress: async () => {
    await deleteCommitment(db, id);
    await load();          // reloads list
    await refreshBudget(db); // recalcs budget
  }
  ```
  If `deleteCommitment` succeeds but `load()` fails, the item disappears from UI but budget still includes it.
- **Impact:** Inconsistent state between commitment list and budget calculation.
- **Fix:** Wrap in try-catch, reload both on success, show error on failure.

---

## MODERATE BUGS

### BUG-013: Currency Parser Strips Commas Incorrectly
- **File:** `src/utils/currency.ts:7`
- **Problem:** `parseAmountString` removes commas before parsing. Israeli format "1,234.56" becomes "1234.56" (correct), but some CSV formats use commas as decimal separators ("1.234,56" European format) which becomes "1.23456".
- **Impact:** European-format CSVs would have amounts parsed as ~100x smaller than actual.
- **Fix:** Detect decimal separator convention (last separator is decimal), or document that only Israeli/US formats are supported.

### BUG-014: No Validation on Big Event Cumulative Total
- **File:** `app/(tabs)/settings.tsx:148-173`
- **Problem:** User can add multiple big events with no limit. If total big event amortization exceeds daily budget, `dailyBudget` goes to 0 or negative (clamped to 0).
- **Impact:** Budget becomes unusable — shows 0 daily budget with no explanation why.
- **Fix:** Warn user if cumulative big event amortization would reduce daily budget below a useful threshold (e.g., below 10% of normal daily budget).

### BUG-015: Onboarding Store Not Reset on CSV Re-Import
- **File:** `app/(tabs)/settings.tsx:174`, `src/stores/onboarding-store.ts`
- **Problem:** When user clicks "Re-import CSV" in settings, `router.push('/(onboarding)/csv-upload')` navigates to CSV upload but doesn't call `useOnboardingStore.getState().reset()` first.
- **Impact:** Old CSV data from previous import lingers in the store until overwritten by `setCsvData()`. If user cancels midway, stale data remains.
- **Fix:** Call `reset()` before navigating to re-import.

### BUG-016: No Big Event Delete/Edit UI
- **File:** `app/(tabs)/settings.tsx`
- **Problem:** Big events can be added but never removed or edited. The list shows them read-only with no delete button.
- **Impact:** User can't undo a mistakenly added big event; it amortizes over the entire month.
- **Fix:** Add a delete button next to each big event that removes it from the JSON array and refreshes the budget.

### BUG-017: Category "subscriptions" Appears in Leisure Category Picker
- **File:** `app/(tabs)/commitments.tsx:168`, `src/core/constants/categories.ts`
- **Problem:** `CATEGORY_KEYS.filter((k) => k !== 'other')` still includes "subscriptions" in the category picker for new commitments. Subscriptions is a commitment type, not a leisure spending category.
- **Impact:** Minor UX confusion — user can categorize a gym membership as "Subscriptions" category which is redundant.
- **Fix:** Filter out 'subscriptions' from category picker in commitment modal, or rename the category to avoid confusion with commitment type.

### BUG-018: Foreign Keys Enabled but None Defined
- **File:** `src/core/db/migrations.ts:3`
- **Problem:** `PRAGMA foreign_keys = ON` is set, but no tables have foreign key constraints defined.
- **Impact:** No actual data integrity enforcement at the DB level. The pragma is a no-op.
- **Fix:** Either remove the pragma (honest), or add proper foreign keys if tables gain relationships.

---

## CLEANUP ISSUES

### CLN-001: Dead Template Files (7+ files)
- **Files:**
  - `components/EditScreenInfo.tsx` — never imported
  - `components/ExternalLink.tsx` — only imported by EditScreenInfo
  - `components/StyledText.tsx` — never imported
  - `components/Themed.tsx` — only imported by dead files
  - `components/useColorScheme.ts` + `useColorScheme.web.ts` — never imported
  - `components/useClientOnlyValue.ts` + `useClientOnlyValue.web.ts` — never imported
  - `constants/Colors.ts` — only imported by dead files
- **Fix:** Delete all listed files.

### CLN-002: Unused npm Dependencies (6 packages)
- **Packages:**
  - `expo-web-browser` — only used by dead ExternalLink.tsx
  - `expo-linking` — zero imports in codebase
  - `expo-constants` — zero imports in codebase
  - `react-native-web` — zero imports (only needed for web builds)
  - `react-native-reanimated` — zero imports in codebase
  - `react-native-worklets` — zero imports in codebase
- **Fix:** `npm uninstall expo-web-browser expo-linking expo-constants react-native-web react-native-reanimated react-native-worklets`

### CLN-003: Unused Exported Functions
- **Files and functions:**
  - `src/utils/validation.ts` — `isValidAmount()`, `isValidDescription()`, `isValidApiKey()`, `isValidTarget()` (all 4 exported, none imported anywhere)
  - `src/utils/date.ts` — `daysInMonth()`, `isToday()` (exported, never imported)
  - `src/core/db/queries/commitments.ts` — `getAllCommitments()` (exported, never imported)
- **Fix:** Either integrate these into the screens that need them (validation.ts should be used in form screens) or remove if truly unneeded.

### CLN-004: Duplicate Month Range Calculation
- **Files:** `src/core/db/queries/transactions.ts:10-12`, `src/core/db/queries/transactions.ts:62-64` (same file, two functions), `src/utils/date.ts:35-38`
- **Problem:** Month start/end calculation repeated 3 times with identical logic.
- **Fix:** Use `getMonthRange()` from `src/utils/date.ts` in the transaction queries instead of inline calculation.

### CLN-005: Duplicate Category Selector UI
- **Files:** `app/(tabs)/add-expense.tsx:78-89`, `app/(tabs)/ask-critic.tsx:82-93`, `app/(tabs)/commitments.tsx:150-162`
- **Problem:** Nearly identical category chip rendering code and styles copy-pasted across 3 screens.
- **Fix:** Extract to `src/features/shared/components/CategorySelector.tsx`.

### CLN-006: Duplicate StyleSheet Definitions
- **Files:** `app/(tabs)/add-expense.tsx`, `app/(tabs)/ask-critic.tsx`
- **Problem:** Identical styles for `budgetHint`, `label`, `input`, `categories`, `categoryChip`, `categoryChipActive`, `categoryText`, `categoryTextActive` — 8 style definitions duplicated word-for-word.
- **Fix:** Extract to `src/features/shared/styles/form-styles.ts`.

### CLN-007: Magic Numbers Scattered Across Codebase
- **Locations:**
  - `0.8` reduction factor — `src/features/onboarding/utils/baseline-calculator.ts:3`
  - `1.5` strict mode threshold — `src/features/agent/hooks/useAICritic.ts:31`, `app/(tabs)/ask-critic.tsx:31`
  - `120` food ceiling — `src/features/agent/utils/price-validator.ts:4`
  - `1024` max tokens — `src/features/agent/utils/anthropic-client.ts:4`
  - `2` days tolerance for dedup — `src/features/budget/utils/deduplication.ts:24`
  - `0.5` description similarity threshold — `src/features/budget/utils/deduplication.ts:21`
- **Fix:** Create `src/core/constants/app-constants.ts` and centralize all magic numbers with documentation.

---

## UX / ACCESSIBILITY ISSUES

### UX-001: No Keyboard Dismiss Handling
- **Files:** All screens with TextInput (`add-expense.tsx`, `ask-critic.tsx`, `commitments.tsx`, `settings.tsx`, `set-target.tsx`)
- **Problem:** ScrollViews missing `keyboardShouldPersistTaps="handled"`. TextInputs missing `returnKeyType` and `onSubmitEditing`.
- **Impact:** User must tap outside input to dismiss keyboard; can't submit via keyboard "Done" button.
- **Fix:** Add `keyboardShouldPersistTaps="handled"` to all ScrollViews with inputs. Add `returnKeyType="done"` to single-line inputs.

### UX-002: No Safe Area Insets on Modals
- **Files:** `app/(tabs)/commitments.tsx:214`, `src/features/onboarding/components/UnrecognizedItemModal.tsx`
- **Problem:** Bottom-sheet modals don't account for home indicator on notched devices.
- **Impact:** Bottom buttons may be hidden behind the home indicator bar.
- **Fix:** Use `useSafeAreaInsets()` and add `paddingBottom: insets.bottom` to modal containers.

### UX-003: Missing StatusBar Configuration
- **File:** `app/_layout.tsx`
- **Problem:** `expo-status-bar` is installed but never used in the app layout.
- **Impact:** Status bar may be wrong color on Android, content may be hidden behind it.
- **Fix:** Add `<StatusBar style="dark" />` to root layout.

### UX-004: Low Contrast Empty State Text
- **Files:** Multiple screens
- **Problem:** Empty state text uses `#94a3b8` on `#f8fafc` background, failing WCAG AA contrast ratio.
- **Fix:** Use `#64748b` or darker for empty state text.

### UX-005: No Confirmation Before Destructive Actions
- **File:** `app/(onboarding)/set-target.tsx:30`
- **Problem:** "Start Tracking" immediately writes `onboarding_completed = true` with no confirmation. If user accidentally taps it with wrong values, they can't redo onboarding.
- **Fix:** Add confirmation dialog, or allow re-onboarding from Settings.

---

## SECURITY ISSUES

### SEC-001: API Key Could Leak in Error Messages
- **File:** `src/features/agent/utils/anthropic-client.ts:29`
- **Problem:** Error thrown includes full response body text: `throw new Error(\`Anthropic API error (${response.status}): ${errorBody}\`)`. If the error response echoes back request headers, the API key could be exposed in crash logs or error displays.
- **Fix:** Sanitize error messages. Map status codes to user-friendly messages:
  - 401 → "Invalid API key"
  - 429 → "Rate limited, try again later"
  - 500 → "API temporarily unavailable"

### SEC-002: No Rate Limiting on AI Critic Calls
- **File:** `src/features/agent/hooks/useAICritic.ts`
- **Problem:** No debounce or rate limit. User can rapidly press "Ask the Critic" and generate many API calls, incurring unexpected costs.
- **Fix:** Add minimum 5-second cooldown between calls. Disable button during cooldown.

### SEC-003: Database Not Encrypted at Rest
- **File:** `src/core/db/database.ts`
- **Problem:** SQLite database stored as plaintext file on device. Any app with file access (rooted device, backup extraction) can read all transaction history.
- **Impact:** All financial data exposed if device is compromised.
- **Fix:** Consider using SQLCipher via a community wrapper, or at minimum document this as a known limitation.

---

## MISSING FEATURES (from spec)

### FEAT-001: Commitment Projection Not Visualized
- **Spec:** "When analyzing CSV, project future installments onto the budget of coming months"
- **Status:** `commitment-projection.ts` exists with logic, but no screen or UI displays it.
- **Fix:** Add projection view to Commitments tab showing which months have which installment charges.

### FEAT-002: Deduplication Not Wired Up
- **Spec:** "Match manual entries with CSV records to avoid double-counting"
- **Status:** `deduplication.ts` exists with logic, but never called from any screen or hook.
- **Fix:** Call `findDuplicates()` during CSV re-import flow and present matches to user for confirmation.

### FEAT-003: No Transaction Delete/Edit
- **Spec:** Not explicitly mentioned, but implied by "The Accountant" node.
- **Status:** Transactions can only be added, never deleted or edited.
- **Fix:** Add swipe-to-delete on transaction list items, or long-press for edit/delete menu.

### FEAT-004: No Transaction History Screen
- **Status:** Dashboard shows today's transactions only. No way to view past days or months.
- **Fix:** Add a transaction history view accessible from dashboard, with monthly grouping and category filters.

### FEAT-005: No Reset Onboarding Option
- **Status:** Once `onboarding_completed = true`, user can only re-import CSV but not redo the full flow.
- **Fix:** Add "Reset Onboarding" button in Settings that clears the flag and redirects.
