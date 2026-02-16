# Financial Digital Twin

A local-first Android app that helps you reduce leisure spending. Import your bank's CSV transaction history, and the app automatically detects recurring commitments (subscriptions and installments), calculates a personalized daily budget, and uses Claude AI as a real-time purchase critic to help you make smarter spending decisions.

Built with React Native and Expo. Supports Hebrew and Israeli bank formats out of the box.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running on Your Android Phone](#running-on-your-android-phone)
  - [Option A: Expo Go (Quickest)](#option-a-expo-go-quickest)
  - [Option B: Development Build (Full Features)](#option-b-development-build-full-features)
- [First Launch - Onboarding](#first-launch---onboarding)
- [Setting Up the AI Critic](#setting-up-the-ai-critic)
- [App Screens](#app-screens)
- [Troubleshooting](#troubleshooting)

---

## Features

- **CSV Import** - Import transaction history from any Israeli or international bank (CSV format)
- **Auto-detection** - Automatically identifies subscriptions, installments, and recurring payments
- **Daily Budget** - Calculates a smart daily leisure budget based on your target, commitments, and spending
- **AI Purchase Critic** - Ask Claude AI whether a purchase is worth it before you buy
- **Offline Mode** - Works without an API key using built-in heuristic budget checks
- **Wishlist Fund** - Unspent budget surplus rolls into a savings fund at month-end
- **Big Event Planning** - Amortize large planned expenses across multiple months
- **Privacy First** - All data stored locally on your device. Only minimal purchase context is sent to the AI (never raw financial data)

---

## Prerequisites

Before you begin, make sure you have the following installed on your **computer** (the development machine):

### 1. Node.js (v18 or newer)

Download and install from [https://nodejs.org](https://nodejs.org). Pick the **LTS** version.

Verify installation:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### 2. Git

Download from [https://git-scm.com](https://git-scm.com) if not already installed.

Verify:
```bash
git --version
```

### 3. Expo CLI

No global install needed - the project uses `npx` to run Expo commands. But make sure `npx` works:
```bash
npx --version
```

### On Your Android Phone

- **Android 6.0 (API 23) or newer**
- **Expo Go app** - Install it from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Installation

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Financial-Agen
```

Or if you already have the project folder, open a terminal and navigate to it:
```bash
cd path/to/Financial-Agen
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including Expo SDK 54, React Native, SQLite, and all other dependencies. This may take a few minutes on the first run.

### Step 3: Verify the Installation

Run a type check to make sure everything is set up correctly:
```bash
npx tsc --noEmit
```

If this completes without errors, you're good to go.

---

## Running on Your Android Phone

Make sure your **computer** and your **Android phone** are connected to the **same Wi-Fi network**.

### Option A: Expo Go (Quickest)

This is the fastest way to run the app on your phone. No Android Studio or SDK required.

#### 1. Install Expo Go on Your Phone

Open the Google Play Store on your Android phone and search for **"Expo Go"**, then install it.

#### 2. Start the Development Server

On your computer, in the project folder, run:
```bash
npx expo start
```

You will see a QR code printed in the terminal, along with some options.

#### 3. Connect Your Phone

- Open the **Expo Go** app on your Android phone
- Tap **"Scan QR Code"**
- Point your phone camera at the QR code displayed in your terminal
- The app will download the JavaScript bundle and launch on your phone

> **Tip:** The first load may take 30-60 seconds. Subsequent loads are faster due to caching.

#### If the QR Code Doesn't Work

If your phone can't connect via the QR code (common on some corporate/university Wi-Fi networks), try tunnel mode:
```bash
npx expo start --tunnel
```

This routes the connection through Expo's servers, bypassing local network restrictions. You may be prompted to install `@expo/ngrok` - type `y` to confirm.

### Option B: Development Build (Full Features)

If you need native features that Expo Go doesn't support, you can create a development build. This requires Android Studio.

#### 1. Install Android Studio

Download from [https://developer.android.com/studio](https://developer.android.com/studio) and install it. During setup, make sure to install:
- Android SDK
- Android SDK Platform-Tools
- Android Emulator (optional, for testing on your computer)

#### 2. Enable USB Debugging on Your Phone

On your Android phone:
1. Go to **Settings > About Phone**
2. Tap **"Build Number"** 7 times until you see "You are now a developer"
3. Go back to **Settings > Developer Options**
4. Enable **"USB Debugging"**

#### 3. Connect via USB and Run

Connect your phone to your computer with a USB cable. Accept the "Allow USB debugging" prompt on your phone.

Then run:
```bash
npx expo run:android
```

This will build the app natively and install it on your connected phone.

---

## First Launch - Onboarding

When you open the app for the first time, you'll go through a 4-step onboarding:

### Step 1: Welcome
Introduction screen explaining what the app does.

### Step 2: CSV Upload
Import your bank transaction history:
1. Tap the upload button
2. Select a CSV file exported from your bank
3. The app auto-detects columns (date, description, amount) - supports both Hebrew and English column names
4. Transactions are parsed, filtered to leisure categories, and analyzed for recurring patterns

> **Supported CSV formats:**
> - Date formats: `DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY`, `YYYY-MM-DD`
> - Hebrew bank columns: `סכום`, `תאריך`, `תיאור`, `שם בית עסק`
> - Installment patterns: `תשלום X מתוך Y`, `X/Y תשלומים`

### Step 3: Review Commitments
Review the automatically detected subscriptions and installments. You can:
- Confirm or remove detected commitments
- Adjust amounts if needed

### Step 4: Set Target
Set your monthly leisure spending target. The app suggests a target based on your historical spending baseline.

After completing onboarding, you'll land on the main Dashboard.

---

## Setting Up the AI Critic

The AI critic uses Claude (by Anthropic) to evaluate your purchases. To enable it:

1. Go to the **Settings** tab in the app
2. Enter your **Anthropic API key**
   - Get one at [https://console.anthropic.com](https://console.anthropic.com)
   - Create an account and generate an API key
3. The key is stored securely on your device using `expo-secure-store`

**Without an API key**, the app still works - the "Ask Critic" feature falls back to built-in heuristic checks based on your budget and spending patterns.

**Privacy note:** When using the AI critic, only the following is sent to the API:
- Item name and price
- Spending category
- Your current daily budget
- Historical median spend for the category
- How far you are from your savings goal

No raw bank data, transaction history, or personal financial details are ever sent.

---

## App Screens

After onboarding, the app has 5 tabs:

| Tab | Description |
|-----|-------------|
| **Dashboard** | Your daily budget, spending progress, and rolling offset status |
| **Add Expense** | Log a leisure purchase with amount, description, and category |
| **Ask Critic** | Get an AI-powered verdict on whether a purchase is worth it |
| **Commitments** | View and manage subscriptions and installments |
| **Settings** | API key, savings goal, big events, monthly target, reset onboarding |

---

## Troubleshooting

### "Unable to connect" or QR code doesn't work
- Make sure your phone and computer are on the **same Wi-Fi network**
- Try running with `--tunnel` flag: `npx expo start --tunnel`
- Check that no firewall is blocking port 8081 on your computer

### App crashes on launch
- Make sure you have **Expo Go** updated to the latest version from the Play Store
- Run `npm install` again to ensure all dependencies are installed
- Delete the `.expo` folder and try again: `rm -rf .expo && npx expo start`

### CSV import doesn't work
- Make sure your CSV file uses UTF-8 encoding (most banks export this by default)
- The file must have at least columns for: date, description/merchant name, and amount
- If auto-detection fails, check that your CSV isn't using unusual delimiters

### "Module not found" errors
Clear the cache and reinstall:
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Slow performance on first load
This is normal. The first JavaScript bundle download takes 30-60 seconds. After that, Metro caches the bundle and reloads are near-instant.

### Development server port conflict
If port 8081 is already in use:
```bash
npx expo start --port 8082
```

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Expo SDK 54 | Managed React Native workflow |
| TypeScript (strict) | Type safety |
| expo-router | File-based navigation |
| expo-sqlite | Local SQLite database |
| Zustand | State management |
| expo-secure-store | Secure API key storage |
| papaparse | CSV parsing |
| Anthropic Claude API | AI purchase critic |

---

## Project Structure

```
Financial-Agen/
├── app/                    # Screens (expo-router file-based routing)
│   ├── (onboarding)/       # 4-step onboarding flow
│   │   ├── welcome.tsx
│   │   ├── csv-upload.tsx
│   │   ├── review-commitments.tsx
│   │   └── set-target.tsx
│   ├── (tabs)/             # Main app tabs
│   │   ├── index.tsx       # Dashboard
│   │   ├── add-expense.tsx
│   │   ├── ask-critic.tsx
│   │   ├── commitments.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx         # Root layout (SQLite provider, fonts)
│   └── index.tsx           # Entry point (routes to onboarding or tabs)
├── src/
│   ├── core/
│   │   ├── db/queries/     # SQLite query functions
│   │   └── constants/      # Categories, filters
│   ├── features/
│   │   ├── onboarding/     # CSV pipeline, column detection
│   │   ├── budget/         # Daily budget engine
│   │   └── agent/          # AI critic client
│   ├── stores/             # Zustand state stores
│   └── components/         # Shared UI components
├── assets/                 # Images, fonts
├── package.json
├── tsconfig.json
└── app.json                # Expo configuration
```

---

## License

Private project.
