# Plan: Implement 5 Missing Features from Spec

## Context
The bugfix.md lists 5 features (FEAT-001 through FEAT-005) that have backend logic already implemented but are not wired up in the UI or are entirely missing. This plan implements all 5.

## Implementation Order
1. **FEAT-005** - Reset Onboarding (simplest, 1 file)
2. **FEAT-003** - Transaction Delete/Edit (needed by FEAT-004)
3. **FEAT-004** - Transaction History Screen (reuses FEAT-003 queries)
4. **FEAT-001** - Commitment Projection Visualization (self-contained)
5. **FEAT-002** - Deduplication Wire-Up (most complex)

---

## FEAT-005: Reset Onboarding
**Modify:** `app/(tabs)/settings.tsx`

- Add `handleResetOnboarding` function: shows confirmation Alert, on confirm calls `setSetting(db, 'onboarding_completed', 'false')` + `useOnboardingStore.getState().reset()` + `router.replace('/(onboarding)/welcome')`
- Add red-bordered "Reset Onboarding" button below the existing "Re-import CSV" button
- Preserves existing data (transactions, commitments) — only resets the onboarding flag

---

## FEAT-003: Transaction Delete/Edit
**Modify:** `src/core/db/queries/transactions.ts`
- Add `deleteTransaction(db, id)` — `DELETE FROM transactions WHERE id = ?`
- Add `updateTransaction(db, id, fields)` — dynamic SET clauses from partial fields object

**Modify:** `app/(tabs)/index.tsx`
- Change transaction rows from `View` to `TouchableOpacity` with `onLongPress`
- Long-press shows Alert with Edit/Delete options
- Delete: calls `deleteTransaction` + `refreshBudget` + refreshes list
- Edit: opens bottom-sheet Modal with amount, description, category fields (same pattern as commitments.tsx modal)
- Add `refreshBudget` from budget store, `CategorySelector` component

---

## FEAT-004: Transaction History Screen
**Create:** `app/history.tsx` — new stack screen (not a tab)
- Month picker header with `<` / `>` arrows, prevents navigating past current month
- Uses existing `getTransactionsForMonth(db, year, month)` query
- `SectionList` grouped by date (using `groupByDate` helper)
- Shows monthly total, category label per item
- Long-press to delete (reuses `deleteTransaction` from FEAT-003)

**Modify:** `app/_layout.tsx` — register `<Stack.Screen name="history" />`

**Modify:** `app/(tabs)/index.tsx` — add "View All" link next to "Today's Transactions" title, navigates to `/history`

---

## FEAT-001: Commitment Projection Visualization
**Modify:** `app/(tabs)/commitments.tsx`
- Import existing `projectCommitments` from `src/features/budget/utils/commitment-projection.ts`
- Compute `projections = projectCommitments(commitments)` from local state
- Add collapsible "Show 6-Month Projection" toggle below "Total Monthly" footer
- When expanded: renders each month as a card with month label, total, and breakdown list of commitments
- `formatMonthLabel` helper converts YYYY-MM to readable month name
- Refactor footer style: split `footer` into container + `totalRow` for the existing total line

---

## FEAT-002: Wire Up Deduplication
**Modify:** `src/features/budget/utils/deduplication.ts` — export `DuplicateMatch` interface

**Modify:** `src/features/onboarding/hooks/useCSVImport.ts`
- Accept optional `db?: SQLiteDatabase` parameter
- Add `'dedup_review'` to `ImportStatus` union
- In `analyze()`: if `db` provided, load last 3 months of existing transactions, call `findDuplicates()`, if matches found set status to `'dedup_review'` and pause
- Add `finalizeDedup(excludedIndices)` function that filters out selected duplicates then calls `setCsvData` as normal
- New state: `duplicates`, `pendingAnalysis`

**Create:** `src/features/onboarding/components/DuplicateReviewModal.tsx`
- Bottom-sheet modal listing duplicate matches with checkboxes (all checked by default = excluded)
- Shows description, amount, date, confidence % for each
- "Exclude N duplicates and Continue" button calls `onConfirm(excluded)`

**Modify:** `app/(onboarding)/csv-upload.tsx`
- Get `db` via `useSQLiteContext()`, pass to `useCSVImport(db)`
- Render `DuplicateReviewModal` when `status === 'dedup_review'`
- Dedup is automatically skipped during first-time onboarding (no existing transactions in DB)

---

## Files Summary

| File | Action | Features |
|------|--------|----------|
| `app/(tabs)/settings.tsx` | Modify | FEAT-005 |
| `src/core/db/queries/transactions.ts` | Modify | FEAT-003 |
| `app/(tabs)/index.tsx` | Modify | FEAT-003, FEAT-004 |
| `app/history.tsx` | Create | FEAT-004 |
| `app/_layout.tsx` | Modify | FEAT-004 |
| `app/(tabs)/commitments.tsx` | Modify | FEAT-001 |
| `src/features/budget/utils/deduplication.ts` | Modify | FEAT-002 |
| `src/features/onboarding/hooks/useCSVImport.ts` | Modify | FEAT-002 |
| `app/(onboarding)/csv-upload.tsx` | Modify | FEAT-002 |
| `src/features/onboarding/components/DuplicateReviewModal.tsx` | Create | FEAT-002 |

## Verification
- Run `npx tsc --noEmit` after each feature to verify no type errors
- For each feature, verify the UI renders correctly on Android emulator via `npx expo start --android`
- FEAT-005: Settings > Reset Onboarding > confirm > should redirect to welcome screen
- FEAT-003: Dashboard > long-press transaction > Edit/Delete both work, budget refreshes
- FEAT-004: Dashboard > "View All" > history screen loads, month picker works, long-press delete works
- FEAT-001: Commitments tab > "Show 6-Month Projection" > shows month cards with correct totals
- FEAT-002: Settings > Re-import CSV > if duplicates found, modal appears, excluding works
