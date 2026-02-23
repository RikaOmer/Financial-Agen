

## Context

We are building a local-first Android app (React Native/Expo/SQLite) for leisure budget optimization. The goal is to move beyond simple math and implement a **Psychological & Behavioral Layer** that understands the user's "Financial DNA."

## Task Overview

Implement the **Advanced Onboarding & Semantic Analysis Engine**. This includes:

1. Extended SQLite Schema for behavioral traits and emotional ROI.
2. A Semantic CSV Parser (Node A Extension) that identifies social vs. personal spending.
3. An Interactive User Interview system for "Transparent Commitments."
4. The "AI Critic" Logic (Node B) integration using psychological profiling.

---

## 1. Data Layer Extension (SQLite)

Modify/Create the following tables to support the behavioral engine:

```sql
-- Psychological Profiling & Traits
CREATE TABLE user_traits (
    trait_id TEXT PRIMARY KEY, -- e.g., 'impulse_spender', 'social_butterfly', 'convenience_addict'
    score REAL DEFAULT 0.0,    -- 0.0 to 1.0
    last_updated DATETIME
);

-- Emotional ROI & Categorization
CREATE TABLE category_config (
    category_name TEXT PRIMARY KEY,
    emotional_priority INTEGER, -- 1 (Low) to 10 (High)
    is_functional BOOLEAN,      -- Is it a need-based leisure (e.g., work lunch) or pure joy?
    notes TEXT
);

-- The Interview Queue (For unresolved CSV items)
CREATE TABLE interview_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    flag_reason TEXT, -- e.g., 'high_outlier', 'potential_subscription'
    status TEXT DEFAULT 'pending' -- 'pending', 'resolved'
);

```

---

## 2. Node A Extension: Semantic CSV Analysis

Implement a logic class `SemanticDetective` that processes the CSV data after the initial parse:

* **Outlier Detection:** Flag transactions that are >80% higher than the category median (e.g., a 250 NIS restaurant bill). Label as `potential_social_expense`.
* **Convenience Tax Identification:** Group all deliveries (Wolt, Bolt, etc.) and calculate their frequency.
* **Commitment Discovery:** Look for "Life Constraints" like recurring payments to pet stores, academic institutions, or high-end hobby shops.

---

## 3. The "Digital Twin" Interview Logic

Create a service `OnboardingInterview` that handles the following interactive flows:

* **The Social Filter:** For flagged outliers, ask: *"I noticed some high restaurant spends. Is this a shared date-night expense or a personal luxury?"*
* **Emotional ROI Mapping:** Prompt the user to rank the "Joy Factor" of their top 5 spending categories.
* **Constraint Identification:** Ask specifically about:
* Pets (Maintenance costs).
* Degree/Studies (Mandatory leisure/tools).
* Professional rewards (Treats after a hard work week).



---

## 4. Node B Extension: The AI Critic (Prompt Engineering)

Update the `AnthropicService` to include the **Behavioral Context** in the prompt. The prompt sent to Claude must follow this structure:

```typescript
const prompt = `
User Profile: 
- Personality: ${traits.primary} (Score: ${traits.score})
- High Priority (Emotional ROI): ${categories.highPriority}
- Low Priority (Convenience): ${categories.lowPriority}
- Constraints: ${constraints.join(", ")}

Scenario: User wants to spend ${amount} NIS on ${item}.
Budget Status: Daily available is ${dailyBudget} NIS.

Task: Act as the 'Constructive Critic'. 
- If the item is in a High Emotional ROI category, be supportive but check the budget.
- If the item matches a 'Convenience Addict' trait (e.g., fast food when they have a habit), be firm and use 'Constructive Friction'.
- Compare price to the user's historical median of ${historicalMedian} NIS.
- Use the user's specific goals (iPhone 17) as leverage.
`;

```

---

## 5. Execution Instructions for Claude Code

1. **Model First:** Update the SQLite schema.
2. **Logic Second:** Implement the `SemanticDetective` to process the uploaded CSV and populate the `interview_queue`.
3. **UI Third:** Create a simple "Interview Component" that iterates through the `interview_queue`.
4. **Integration:** Connect the `user_traits` and `category_config` results to the `JudgeNode` (Node B) API call.

**Constraint:** Keep all logic within `src/features/behavioral` and use `Zustand` for state synchronization between the interview results and the budget engine.

