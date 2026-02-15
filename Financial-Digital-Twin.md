# **Project Specification: Financial Digital Twin (Leisure Optimizer)**

## **1\. High-Level Overview**

A personal, local-first Android application (React Native/Expo) designed to drastically reduce leisure spending. The system uses a one-time CSV upload to analyze historical "Financial DNA," identifies recurring commitments, and acts as a real-time "AI Critic" for new expenses.

**Core Philosophy:** \* **Focus:** Leisure spending only (ignore fixed costs like rent/utilities).

* **AI-Driven:** Every significant purchase is validated by Anthropic’s Claude for "value-for-money" relative to historical data and market benchmarks.  
* **Privacy:** All financial data stays on-device (SQLite).

## ---

**2\. Tech Stack Requirements**

* **Framework:** React Native \+ Expo (Managed Workflow).  
* **Language:** TypeScript.  
* **Database:** expo-sqlite (Local-first).  
* **State Management:** Zustand (Lightweight and modular).  
* **AI Integration:** Anthropic SDK (using Claude 3.5 Sonnet or 4o-mini via API).  
* **CSV Parsing:** papaparse.

## ---

**3\. Data Schema (SQLite)**

SQL

\-- Recurring leisure commitments (Netflix, Gym, or Item Installments)  
CREATE TABLE commitments (  
    id INTEGER PRIMARY KEY AUTOINCREMENT,  
    name TEXT,  
    amount REAL,  
    type TEXT CHECK(type IN ('subscription', 'installment')),  
    total\_installments INTEGER,      \-- Null for subscriptions  
    remaining\_installments INTEGER,  \-- Decremented monthly  
    end\_date DATE,  
    category TEXT  
);

\-- Daily leisure spending (Manual entry)  
CREATE TABLE transactions (  
    id INTEGER PRIMARY KEY AUTOINCREMENT,  
    amount REAL,  
    description TEXT,  
    category TEXT,  
    timestamp DATETIME DEFAULT CURRENT\_TIMESTAMP  
);

\-- App state and goals  
CREATE TABLE settings (  
    key TEXT PRIMARY KEY,  
    value TEXT  
);  
\-- Keys: 'monthly\_leisure\_target', 'baseline\_avg', 'savings\_goal\_name', 'savings\_goal\_amount'

## ---

**4\. Core Logic & Nodes**

### **Node A: The Detective (Initialization)**

**Input:** CSV file from Bank/Credit Card.

**Logic:**

1. **Filter:** Remove non-leisure keywords (Electric, Rent, Tax, etc.).  
2. **Identify Patterns:**  
   * Detect installments via "X of Y" strings.  
   * Detect subscriptions via recurring monthly amounts/merchant names.  
3. **Calculate Baseline:** Establish the average monthly leisure spend ($Avg\_{leisure}$).  
4. **Output:** Proposed $Monthly\\\_Target$ (e.g., $Avg\_{leisure} \\times 0.8$).

### **Node B: The Judge (Rolling Budget & AI)**

**Trigger:** User asks: "Can I buy \[Item\] for \[Price\]?"

**Logic Steps:**

1. **Calculate Daily Available ($B\_{daily}$):**  
   $$B\_{daily} \= \\frac{Monthly\\\_Target \- \\sum(Commitments) \- \\sum(Spent\\\_This\\\_Month)}{Days\\\_Remaining\\\_In\\\_Month}$$  
2. **Context Gathering:** Fetch historical median price for \[Item\] from transactions.  
3. **AI Prompt (Anthropic):**  
   Send a system prompt to Claude containing:  
   * Price & Item.  
   * User's historical avg for this category.  
   * Current $B\_{daily}$.  
   * Distance to Savings Goal.  
4. **Constraint:** If $Price \> B\_{daily} \\times 1.5$, the AI must be "Strict."

### **Node C: The Accountant (Update)**

**Logic:** Record approved/manual transactions, update the transactions table, and recalculate rolling budget for the next day.

## ---

**5\. Implementation Guidelines for Claude Code**

### **Folder Structure**

Follow **Feature-Based Clean Architecture**:

* /src/features/onboarding: CSV Logic & Initial Setup.  
* /src/features/budget: Calculations for $B\_{daily}$ and rolling logic.  
* /src/features/agent: Anthropic API integration & Prompt Engineering.  
* /src/core/db: SQLite migrations and wrappers.

### **Key Functional Requirements**

1. **The Rolling Offset:** Implement logic where $B\_{daily}$ increases if yesterday's spend was 0\.  
2. **Commitment Projection:** When analyzing CSV, project future installments onto the budget of coming months.  
3. **Value Validation:** The AI Critic must recognize if a price is objectively "High" (e.g., 82 NIS for a burger) regardless of the user's current balance.  
4. **Deduplication:** When a user uploads a CSV in the future (optional), match manual entries with CSV records to avoid double-counting.

### **Security Note**

* Store the Anthropic API Key in expo-secure-store.  
* No financial data should be sent to the AI except for the specific item name and price for validation.

## ---

**6\. Edge Cases to Handle**

1. **The Big Event:** Allow the user to "Shed" a budget for a specific day (e.g., a wedding) which the system then amortizes over the rest of the month.  
2. **End of Month:** Any $\\Delta$ (surplus) at the end of the month must be moved to the Wishlist\_Fund status, not rolled into next month's leisure.  
3. **Unrecognized CSV:** If the Parser fails to categorize an item, the UI must prompt the user for a one-time classification.

