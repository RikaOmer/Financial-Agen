# UI/UX Comprehensive Overhaul Plan

## Context
The Financial Digital Twin app is fully functional but has a prototype-level UI: hardcoded colors in every file, no animations, native `Alert` for all feedback, minimal icons, no loading skeletons, plain circle-border budget gauge, and inconsistent styling across screens. This plan transforms it into a polished, cohesive mobile app across 7 incremental phases. **No new npm packages** — only React Native's built-in `Animated` API, `Pressable`, and the already-installed `@expo/vector-icons`.

---

## Phase 1: Theme System & Shared Primitives

### 1A. Create `src/core/theme.ts`
Central design tokens file — all other files import from here:
- **Colors**: primary/success/warning/danger palettes (main, light, bg, border, text), surface colors, text hierarchy, overlays
- **Typography**: heading1–4, body, caption, label, overline, buttonLarge/Default/Small, number/numberSmall
- **Spacing**: xxs(2)→xxxl(40) on 4px base
- **Radius**: sm(6)→pill(999)
- **Shadows**: none/sm/md/lg presets
- **Durations**: fast(150)/normal(250)/slow(400)/entrance(350)

**Full token values:**
```typescript
export const colors = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryBg: '#eff6ff',
  primaryBorder: '#bfdbfe',

  success: '#16a34a',
  successLight: '#22c55e',
  successBg: '#f0fdf4',
  successBorder: '#a7f3d0',

  warning: '#f59e0b',
  warningDark: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: '#92400e',

  danger: '#dc2626',
  dangerLight: '#ef4444',
  dangerBg: '#fef2f2',
  dangerBorder: '#fca5a5',
  dangerText: '#b91c1c',

  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  purpleBorder: '#c4b5fd',

  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  textPrimary: '#1a1a1a',
  textSecondary: '#374151',
  textTertiary: '#64748b',
  textDisabled: '#94a3b8',
  textInverse: '#ffffff',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.15)',
} as const;

export const typography = {
  heading1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  heading2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading3: { fontSize: 20, fontWeight: '700' as const },
  heading4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  bodySemiBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  overline: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  buttonLarge: { fontSize: 17, fontWeight: '600' as const },
  buttonDefault: { fontSize: 16, fontWeight: '600' as const },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const },
  number: { fontSize: 28, fontWeight: '800' as const },
  numberSmall: { fontSize: 18, fontWeight: '700' as const },
} as const;

export const spacing = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40,
} as const;

export const radius = {
  sm: 6, md: 10, lg: 12, xl: 16, xxl: 20, pill: 999, circle: 9999,
} as const;

export const shadows = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
} as const;

export const durations = {
  fast: 150, normal: 250, slow: 400, entrance: 350,
} as const;
```

### 1B. Create shared components (all new files in `src/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| **ThemedCard** | `ThemedCard.tsx` | White card with shadow, optional left-border color variant (`'default' | 'primary' | 'success' | 'warning' | 'danger'`), optional fade+slideUp entrance animation via `animated` prop |
| **ThemedButton** | `ThemedButton.tsx` | `Pressable` with `android_ripple`, variants (primary/secondary/success/danger/ghost/outline), sizes (sm/md/lg), `loading` state with spinner, scale-down press animation (0.97), optional `icon` + `iconFamily` props |
| **SectionHeader** | `SectionHeader.tsx` | Left title (heading4) + optional right action text (primary color) with onPress |
| **AnimatedNumber** | `AnimatedNumber.tsx` | Count-up/down animation when value changes using `Animated.timing` (400ms). Props: `value`, `prefix?` (e.g. "₪"), `style?` |
| **Toast** | `Toast.tsx` | `ToastProvider` wraps app + `useToast()` hook returns `showToast(message, type?, duration?)`. Types: success/error/warning/info. Slides from top, auto-dismiss (3s default), colored left bar + MaterialIcons icon |
| **LoadingSkeleton** | `LoadingSkeleton.tsx` | Pulsing opacity animation (`Animated.loop`). Props: `width`, `height`, `borderRadius`. Preset variants: `'text' | 'circle' | 'card' | 'gauge'` |
| **BottomSheet** | `BottomSheet.tsx` | Animated slide-up spring, backdrop with fade, drag handle pill (40×4px), safe area bottom padding. Props: `visible`, `onClose`, `title?`, `children` |
| **EmptyState** | `EmptyState.tsx` | Centered icon (configurable) + title + description + optional action button. Vertically centered in available space |

### 1C. Update `src/styles/form-styles.ts`
Replace all hardcoded colors and sizes with theme token imports. The budgetHint gets a border with `primaryBorder` color.

---

## Phase 2: Navigation & Tab Bar Polish

### 2A. `app/(tabs)/_layout.tsx`
- Switch icons from `FontAwesome` to `MaterialCommunityIcons` (richer set):
  - Dashboard: `view-dashboard-outline` / `view-dashboard`
  - Add Expense: `plus-circle-outline` / `plus-circle` (tinted `colors.success` to stand out as primary action)
  - Ask Critic: `robot-outline` / `robot`
  - Commitments: `calendar-sync-outline` / `calendar-sync`
  - Settings: `cog-outline` / `cog`
- `tabBarStyle`: increased height (60px), subtle top shadow, `colors.surface` background
- `tabBarLabelStyle`: 11px caption sizing
- Header: `colors.surface` background, `shadows.sm` bottom shadow
- Icon size: 24px (up from 22px)

### 2B. `app/(onboarding)/_layout.tsx`
- Add `animation: 'slide_from_right'` in screenOptions for smooth step transitions
- `headerShadowVisible: false` for cleaner look
- Keep existing blue header theme

### 2C. `app/_layout.tsx`
- Wrap entire app in `ToastProvider` (inside `ThemeProvider`)
- Upgrade `LoadingFallback`: use `LoadingSkeleton` with centered `MaterialCommunityIcons: wallet-outline` icon above it
- History screen: `animation: 'slide_from_bottom'`, styled header with theme colors

---

## Phase 3: Onboarding Screens

### 3A. `app/(onboarding)/welcome.tsx`
- Replace emoji `💰` with `MaterialCommunityIcons: wallet-outline` (80px, primary color) in a circular container (120×120, `colors.primaryBg` background)
- **Entrance animations** using `Animated.timing` + `Animated.stagger`:
  - Hero section: `fadeIn` + `translateY(-20 → 0)` over 500ms
  - Feature rows: each staggered 150ms, `fadeIn` + `translateX(-20 → 0)`
  - Buttons: delayed 600ms, `fadeIn` + `translateY(20 → 0)`
- Feature list: replace left-border text with icon-prefixed rows in light cards:
  - `magnify` → "Analyze your spending DNA from bank statements"
  - `repeat` → "Track subscriptions & installments"
  - `robot` → "Get AI critique before every purchase"
  - Each row: `ThemedCard` with `shadows.sm`, icon (24px primary) + text
- Buttons → `ThemedButton` (primary for "Get Started", outline for "Skip Import")

### 3B. `app/(onboarding)/csv-upload.tsx`
- `MaterialCommunityIcons: file-upload-outline` (48px, primary) above title
- Import button → `ThemedButton` primary lg with `file-document-outline` icon
- Loading: `ThemedCard` with animated rotating `loading` icon + `parseProgress` text
- Results: `ThemedCard` with entrance animation
- Continue → `ThemedButton` success variant
- Errors → inline `ThemedCard` danger variant with icon (no more Alert for errors)
- Mapping chips: larger touch targets (paddingVertical: 10)

### 3C. `app/(onboarding)/review-commitments.tsx`
- Empty state → `EmptyState` component with `playlist-check` icon
- Footer: replace `borderTopWidth` with `shadows.lg` top shadow
- Total: `AnimatedNumber` component
- Confirm button → `ThemedButton` primary with `arrow-right` icon
- List items: staggered fade-in entrance animation

### 3D. `app/(onboarding)/set-target.tsx`
- Baseline card → `ThemedCard` variant `'primary'` with `chart-line` icon in header
- Amounts → `AnimatedNumber`
- Divider: labeled divider with "Optional" text centered between horizontal lines
- Input focus: animated border color (`colors.border` → `colors.primary`) using `Animated.timing` + color interpolation
- Button → `ThemedButton` success with `rocket-launch-outline` icon
- Replace `Alert.alert` confirmation with `BottomSheet` showing summary + two `ThemedButton`s

---

## Phase 4: Dashboard & Core Tab Screens

### 4A. `app/(tabs)/index.tsx` (Dashboard) — highest impact screen
- **Stats grid**: each stat in `ThemedCard` with themed icon:
  - Monthly Target: `MaterialCommunityIcons: target` (primary)
  - Commitments: `calendar-sync` (warning)
  - Spent This Month: `cart-outline` (danger)
  - Days Remaining: `calendar-clock` (success)
- **All monetary values**: `AnimatedNumber` component
- **Transaction rows**: category icon on left (from category-icons map), `Pressable` with `android_ripple`
- **Empty state**: `EmptyState` with `party-popper` icon + "No spending today. Keep it up!"
- **Loading state**: full skeleton layout:
  - `LoadingSkeleton` circle (gauge area)
  - Two row skeletons (stat cards)
  - Three line skeletons (transactions)
- **Edit modal** → `BottomSheet` component
- **Entrance**: staggered `ThemedCard` animations (80ms delay between each)

### 4B. `src/features/budget/components/BudgetGauge.tsx` — biggest visual upgrade
Transform the plain circle border into an animated arc gauge:
- **Technique**: Two overlapping semi-circles using `View` + `borderWidth` + `transform: rotate()`:
  1. Background track: full circle border in `colors.borderLight`
  2. Two half-circle masks with `overflow: 'hidden'` and rotation
  3. Rotate fill portions based on `monthlyRatio`
  4. Animate rotation on mount with `Animated.timing`
- **Center**: `AnimatedNumber` for remaining amount + "left today" label
- **Below gauge**: segmented monthly bar showing committed/spent/remaining with labels
- **Colors**: green (>70%), amber (40–70%), red (<40%)
- **Danger zone**: subtle scale pulse animation (1.0 → 1.02 → 1.0 loop) when red

### 4C. `src/features/budget/components/WishlistFundBadge.tsx`
- Add `MaterialCommunityIcons: piggy-bank-outline` icon (24px)
- Fund amount → `AnimatedNumber`
- Target line marker on progress bar (small triangle indicator)
- When progress >= 100%: change bg to `colors.successBg`, add celebration icon
- Entrance: slide up from 20px offset

### 4D. `app/(tabs)/add-expense.tsx`
- Budget hint → larger `ThemedCard` with gauge icon + `AnimatedNumber` for daily budget
- Amount input: larger font (24px), centered, NIS symbol prefix inside input
- Replace `Alert` success → `useToast().showToast('Expense added!', 'success')`
- Replace `Alert` validation error → `useToast().showToast(message, 'error')`
- Button → `ThemedButton` success with `plus` icon
- After save: quick green check scale-up animation (spring bounce, 0 → 1) before form reset

### 4E. `app/(tabs)/ask-critic.tsx`
- Budget hint: same upgrade as Add Expense
- "Ask the Critic" button → `ThemedButton` with `colors.purple`, icon `robot`
- **Loading state**: replace bare `ActivityIndicator` with:
  - `MaterialCommunityIcons: robot-excited-outline` icon above
  - Three animated dots pulsing in sequence (typing indicator effect)
  - "The Critic is thinking..." text with animated ellipsis
- Error → `ThemedCard` danger variant with retry `ThemedButton`
- "Buy Anyway" → `ThemedButton` warning variant
- "Skip" → `ThemedButton` outline variant
- Replace success Alert → toast

---

## Phase 5: Remaining Tabs

### 5A. `app/(tabs)/commitments.tsx`
- Section headers → `SectionHeader` with pill badge showing item count
- Each commitment row → `ThemedCard` with category icon on left
- Delete button → `MaterialIcons: delete-outline` (20px, danger) in circular touchable
- Total → `ThemedCard` primary variant + `AnimatedNumber`
- "Show Projection" toggle → animated chevron rotation (up/down) using `Animated.timing`
- **FAB** (floating action button): replace full-width bottom button with circular 56px button, `shadows.lg`, primary color, `MaterialIcons: add` icon, positioned bottom-right
- Add modal → `BottomSheet`
- Replace all `Alert` → toast

### 5B. `app/(tabs)/settings.tsx`
- Group into `ThemedCard` sections, each with a header row (icon + title):
  - "AI Configuration" → `robot-outline` icon
  - "Budget" → `target` icon
  - "Savings Goal" → `piggy-bank-outline` icon
  - "Big Events" → `calendar-star-outline` icon
  - "Data Management" → `database-outline` icon
  - "Current Budget" → `information-outline` icon
- Input fields: animated border on focus (same as set-target)
- Delete event → `MaterialIcons: delete-outline` icon button
- Reset Onboarding → `ThemedButton` danger variant with `refresh` icon
- Re-import → `ThemedButton` outline with `file-upload-outline` icon
- Non-destructive Alert → toast (keep Alert for destructive: reset, delete)
- Info card values → `AnimatedNumber`

### 5C. `app/history.tsx`
- Month arrows → `MaterialIcons: chevron-left` / `chevron-right` (28px) with press scale animation
- Month label → `typography.heading3`
- Total → `ThemedCard` primary + `AnimatedNumber`
- Date section headers → left accent line (3px primary border)
- Transaction rows → card-style with category icons (same as dashboard)
- Empty state → `EmptyState` with `receipt-text-outline` icon
- Month switch → fade transition: old content opacity out (150ms), new in (250ms)

---

## Phase 6: Component-Level Improvements

| Component | File | Key Changes |
|-----------|------|-------------|
| **ProgressBar** | `src/components/ProgressBar.tsx` | Animated fill width on mount/change (600ms, `Easing.out(Easing.cubic)`). Optional `showLabel` prop for percentage text if height >= 16 |
| **CategorySelector** | `src/components/CategorySelector.tsx` | Category-specific icons on each chip. `Pressable` with ripple. Selected chip animated scale-up (spring). Larger touch targets (paddingVertical: 10, paddingHorizontal: 16) |
| **CriticVerdictCard** | `src/features/agent/components/CriticVerdict.tsx` | Replace text symbols with `MaterialCommunityIcons`: approve → `check-circle` (success), consider → `alert-circle` (warning), reject → `close-circle` (danger). Entrance slide-up + fade animation. Animated confidence bar fill (800ms). `lightbulb-outline` icon for alternative suggestion |
| **StrictnessBadge** | `src/features/agent/components/StrictnessBadge.tsx` | Add `MaterialIcons: warning-amber` icon (20px). Shake entrance animation (translateX oscillation: 0→5→-5→3→-3→0). Pulsing border opacity (0.5↔1.0) |
| **CommitmentCard** | `src/features/onboarding/components/CommitmentCard.tsx` | Use `ThemedCard` as base. Add type icon: subscription → `repeat`, installment → `cash-multiple`. Animated toggle: opacity 1→0.4 transition with `Animated.timing` |
| **CSVPreviewTable** | `src/features/onboarding/components/CSVPreviewTable.tsx` | Theme colors throughout. Header: `colors.primaryBg` bg + `colors.primary` text. Wrap in `ThemedCard` with `overflow: 'hidden'`. Styled "more" badge |
| **UnrecognizedItemModal** | `src/features/onboarding/components/UnrecognizedItemModal.tsx` | Convert to use `BottomSheet`. Category icons next to each button. 2-column grid layout for categories. "Skip" → ghost `ThemedButton` |
| **DuplicateReviewModal** | `src/features/onboarding/components/DuplicateReviewModal.tsx` | Convert to use `BottomSheet`. Replace custom View checkbox with `MaterialCommunityIcons: checkbox-marked` / `checkbox-blank-outline`. Animated opacity toggle. "Continue" → `ThemedButton` success |

---

## Phase 7: Final Polish

### 7A. Create `src/core/constants/category-icons.ts`
Centralized icon mapping used by CategorySelector, transaction rows, commitment rows:
```typescript
export const CATEGORY_ICONS: Record<string, { name: string; family: string }> = {
  food_dining: { name: 'silverware-fork-knife', family: 'MaterialCommunityIcons' },
  entertainment: { name: 'movie-open-outline', family: 'MaterialCommunityIcons' },
  shopping: { name: 'shopping-outline', family: 'MaterialCommunityIcons' },
  housekeeping: { name: 'home-outline', family: 'MaterialCommunityIcons' },
  subscriptions: { name: 'repeat', family: 'MaterialCommunityIcons' },
  other: { name: 'dots-horizontal', family: 'MaterialCommunityIcons' },
};
```

### 7B. Consistency audit across all files
- All hardcoded colors → theme tokens
- All `TouchableOpacity` action buttons → `ThemedButton` or `Pressable`
- All raw `Modal` → `BottomSheet`
- All cards → `ThemedCard`
- All section headers → `SectionHeader`
- All monetary displays → `AnimatedNumber` where appropriate
- All non-destructive `Alert.alert` → toast

---

## Implementation Order & Dependencies

```
Phase 1 (Foundation)  ──  Must be first, all other phases depend on it
  │
  ├── Phase 2 (Navigation)  ──  Independent, can start after Phase 1
  ├── Phase 3 (Onboarding)  ──  After Phase 1
  ├── Phase 4 (Dashboard)   ──  After Phase 1
  ├── Phase 6 (Components)  ──  Can run in parallel with Phases 3-5
  │
  ├── Phase 5 (Remaining)   ──  After Phase 4 (reuses patterns)
  │
  └── Phase 7 (Polish)      ──  Must be last
```

---

## Files Summary

**New files (10):**
- `src/core/theme.ts`
- `src/components/ThemedCard.tsx`
- `src/components/ThemedButton.tsx`
- `src/components/SectionHeader.tsx`
- `src/components/AnimatedNumber.tsx`
- `src/components/Toast.tsx`
- `src/components/LoadingSkeleton.tsx`
- `src/components/BottomSheet.tsx`
- `src/components/EmptyState.tsx`
- `src/core/constants/category-icons.ts`

**Modified files (~22):**
- `src/styles/form-styles.ts`
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(onboarding)/_layout.tsx`
- `app/(onboarding)/welcome.tsx`
- `app/(onboarding)/csv-upload.tsx`
- `app/(onboarding)/review-commitments.tsx`
- `app/(onboarding)/set-target.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/add-expense.tsx`
- `app/(tabs)/ask-critic.tsx`
- `app/(tabs)/commitments.tsx`
- `app/(tabs)/settings.tsx`
- `app/history.tsx`
- `src/features/budget/components/BudgetGauge.tsx`
- `src/features/budget/components/WishlistFundBadge.tsx`
- `src/components/ProgressBar.tsx`
- `src/components/CategorySelector.tsx`
- `src/features/agent/components/CriticVerdict.tsx`
- `src/features/agent/components/StrictnessBadge.tsx`
- `src/features/onboarding/components/CommitmentCard.tsx`
- `src/features/onboarding/components/CSVPreviewTable.tsx`
- `src/features/onboarding/components/UnrecognizedItemModal.tsx`
- `src/features/onboarding/components/DuplicateReviewModal.tsx`

---

## Constraints
- **No new npm packages** — use only React Native `Animated`, `Pressable`, `Platform`, `Easing` and `@expo/vector-icons`
- **Hebrew/RTL**: use `marginEnd`/`marginStart` (logical properties), `flexDirection: 'row'` auto-flips
- **Performance**: `useNativeDriver: true` for opacity/transform animations, `useRef` for Animated values
- **Backward compatible**: all existing functionality preserved, new props are optional with current-behavior defaults

---

## Verification
- `npx tsc --noEmit` — type check passes
- `npx expo start --android` — app loads, all screens render correctly
- Walk through: onboarding (welcome → csv → review → target) → dashboard → add expense → ask critic → commitments → settings → history
- Verify: animations play, toasts appear, skeletons show during load, bottom sheets slide up, icons render, themed colors everywhere
