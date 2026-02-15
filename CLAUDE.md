# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A local-first Android app (React Native/Expo) that reduces leisure spending. Users import bank CSV history, the app detects recurring commitments, calculates a daily budget, and uses Claude AI as a real-time purchase critic.

## Commands

```bash
npx expo start          # Start dev server
npx expo start --android # Run on Android device/emulator
npx tsc --noEmit        # Type check (strict mode)
```

No test framework is configured. No linter is configured.

## Tech Stack

- **Expo SDK 54** (managed workflow, new architecture enabled, typed routes)
- **TypeScript** with strict mode. Path alias `@/*` maps to project root.
- **expo-router** for file-based navigation
- **expo-sqlite** with `SQLiteProvider` and `useSQLiteContext()` hook
- **Zustand** for state management (3 stores: budget, settings, onboarding)
- **Direct fetch to Anthropic API** — no SDK (it doesn't support React Native)
- **papaparse** for CSV parsing
- **expo-secure-store** for API key only

## Architecture

Feature-based layout under `src/`. Screens live in `app/` using expo-router conventions.

**Routing flow:** `app/index.tsx` checks `onboarding_completed` setting → routes to either `/(onboarding)/` (4-step flow) or `/(tabs)/` (5 tabs: Dashboard, Add Expense, Ask Critic, Commitments, Settings).

**App bootstrap** (`app/_layout.tsx`): Loads fonts → wraps app in `SQLiteProvider` (runs migrations) → renders `MonthTransitionRunner` (handles month-end logic on every app open) → `Stack` navigator.

### Key Directories

- `src/core/db/queries/` — Typed query functions. Pattern: `db.getFirstAsync<{ field: type }>()` with `?` params and `COALESCE` for aggregates.
- `src/core/constants/` — Leisure categories (bilingual) and non-leisure keyword filters.
- `src/features/onboarding/` — CSV import pipeline: pick file → parse → auto-detect columns → normalize → filter leisure → detect installments/subscriptions → calculate baseline.
- `src/features/budget/` — Daily budget engine, month transition, big event amortization, wishlist fund.
- `src/features/agent/` — Anthropic API client, prompt builder, response parser, offline fallback heuristics.
- `src/stores/` — Zustand stores (budget-store, settings-store, onboarding-store).
- `src/components/` — Shared UI: `CategorySelector`, `ProgressBar`.

## Core Budget Formula

```
B_daily = (MonthlyTarget - Commitments - SpentThisMonth - BigEventAmortization) / DaysRemaining
```

- **Rolling offset:** If yesterday's spend = 0, carry forward yesterday's B_daily as bonus.
- **Strict mode:** Triggered when price > B_daily × 1.5.
- **Month-end:** Surplus goes to Wishlist Fund (not rolled into next month). Installments decremented. Completed installments deleted.

## Database

Three SQLite tables: `commitments` (subscriptions + installments), `transactions` (daily leisure spending), `settings` (key-value store).

Settings keys: `monthly_leisure_target`, `baseline_avg`, `savings_goal_name`, `savings_goal_amount`, `wishlist_fund`, `big_events` (JSON array), `onboarding_completed`, `last_active_month`.

## AI Integration

- Direct `fetch` to `https://api.anthropic.com/v1/messages` with `claude-sonnet-4-20250514`.
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
- **Privacy:** Only item name, price, category, daily budget, historical median, and savings goal distance are sent. No raw financial data.
- **Offline fallback:** When no API key or API fails, returns heuristic verdict using budget-only checks and price validation.
- Response must be JSON, parsed into `CriticVerdict` (recommendation, reasoning, valueAssessment, confidence).

## Hebrew/Israeli Bank Support

- CSV dates: DD/MM/YYYY (also `-` and `.` separators), plus ISO YYYY-MM-DD.
- Installment patterns: `תשלום X מתוך Y`, `X/Y תשלומים`, `תש XX/YY`, plus English `X of Y`.
- Column detection: Hebrew keywords like `סכום`, `תאריך`, `תיאור`, `שם בית עסק`.
- Categories: Bilingual keywords (e.g., `מסעדה` for restaurant).

## Important Patterns

- **Store hydration:** `useBudgetStore.refreshBudget(db)` must be called on mount. Budget auto-refreshes at midnight via timer in `useBudgetState` hook.
- **Database access:** All screens get `db` via `useSQLiteContext()` and pass it to query functions or store actions.
- **Styles:** `StyleSheet.create()` at bottom of each screen file. Colors hardcoded: `#2563eb` (primary), `#f8fafc` (bg), `#64748b` (text).
- **No pagination:** Transaction lists render all items.

## Commit Conventions

- Commit after each logical phase or feature.
- Keep commits atomic and reviewable.
- Use descriptive messages: "Add budget engine with daily calculation and rolling offset"
