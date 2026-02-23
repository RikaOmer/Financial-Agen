import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  Platform,
  StyleSheet,
} from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from '@/src/stores/settings-store';
import { useBudgetStore } from '@/src/stores/budget-store';
import { getSetting, setSetting, getBigEvents } from '@/src/core/db/queries/settings';
import { createBigEvent } from '@/src/features/budget/utils/big-event';
import { formatNIS } from '@/src/utils/currency';
import { isValidApiKey } from '@/src/utils/validation';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { useToast } from '@/src/components/Toast';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
import type { BigEvent } from '@/src/types/budget';

function AnimatedInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  style,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric';
  style?: any;
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: durations.normal,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: durations.normal,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor }, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
}

function SectionCard({
  iconName,
  iconFamily = 'mci',
  title,
  children,
}: {
  iconName: string;
  iconFamily?: 'mci' | 'mi';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedCard style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        {iconFamily === 'mci' ? (
          <MaterialCommunityIcons name={iconName as any} size={20} color={colors.primary} />
        ) : (
          <MaterialIcons name={iconName as any} size={20} color={colors.primary} />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </ThemedCard>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { apiKey, loadApiKey, setApiKey } = useSettingsStore();
  const { refreshBudget, snapshot } = useBudgetStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [savingsNameInput, setSavingsNameInput] = useState('');
  const [savingsAmountInput, setSavingsAmountInput] = useState('');
  const [bigEventName, setBigEventName] = useState('');
  const [bigEventAmount, setBigEventAmount] = useState('');
  const [bigEventDate, setBigEventDate] = useState('');
  const [bigEvents, setBigEvents] = useState<BigEvent[]>([]);

  useEffect(() => {
    loadApiKey();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const target = await getSetting(db, 'monthly_leisure_target');
    const goalName = await getSetting(db, 'savings_goal_name');
    const goalAmount = await getSetting(db, 'savings_goal_amount');
    const eventsJson = await getBigEvents(db);

    if (target) setTargetInput(target);
    if (goalName) setSavingsNameInput(goalName);
    if (goalAmount) setSavingsAmountInput(goalAmount);
    try { setBigEvents(JSON.parse(eventsJson)); } catch { setBigEvents([]); }
  };

  const handleSaveApiKey = async () => {
    if (!isValidApiKey(apiKeyInput.trim())) {
      showToast('API key must start with "sk-ant-" and be at least 20 characters.', 'warning');
      return;
    }
    await setApiKey(apiKeyInput.trim());
    showToast('API key stored securely.', 'success');
    setApiKeyInput('');
  };

  const handleSaveTarget = async () => {
    const num = parseFloat(targetInput);
    if (!num || num <= 0) return;
    await setSetting(db, 'monthly_leisure_target', String(num));
    useSettingsStore.getState().setMonthlyTarget(num);
    await refreshBudget(db);
    showToast(`Monthly target set to ${formatNIS(num)}`, 'success');
  };

  const handleSaveSavingsGoal = async () => {
    if (savingsNameInput.trim() && savingsAmountInput) {
      await setSetting(db, 'savings_goal_name', savingsNameInput.trim());
      await setSetting(db, 'savings_goal_amount', savingsAmountInput);
      showToast('Savings goal updated.', 'success');
    }
  };

  const handleAddBigEvent = async () => {
    const amount = parseFloat(bigEventAmount);
    if (!bigEventName.trim() || !amount || amount <= 0) {
      showToast('Enter event name and amount.', 'warning');
      return;
    }
    let eventDateStr = new Date().toISOString();
    if (bigEventDate.trim()) {
      const match = bigEventDate.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3].length === 2 ? `20${match[3]}` : match[3];
        eventDateStr = `${year}-${month}-${day}`;
      } else {
        showToast('Enter date as DD/MM/YYYY.', 'warning');
        return;
      }
    }
    const event = createBigEvent(bigEventName.trim(), amount, eventDateStr);
    const updated = [...bigEvents, event];
    const totalAmortization = updated.reduce((sum, e) => sum + (e.amortizedDaily || 0), 0);
    if (snapshot.dailyBudget > 0 && totalAmortization > snapshot.dailyBudget * 0.9) {
      Alert.alert(
        'Warning',
        'Adding this event would consume most of your daily budget. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            onPress: async () => {
              await saveBigEvent(updated);
            },
          },
        ]
      );
      return;
    }
    await saveBigEvent(updated);
  };

  const saveBigEvent = async (updated: BigEvent[]) => {
    await setSetting(db, 'big_events', JSON.stringify(updated));
    setBigEvents(updated);
    setBigEventName('');
    setBigEventAmount('');
    setBigEventDate('');
    await refreshBudget(db);
    const last = updated[updated.length - 1];
    const perDay = last ? formatNIS(last.amortizedDaily) : '';
    showToast(`Event will be amortized at ${perDay}/day until the event date.`, 'success');
  };

  const handleDeleteBigEvent = (id: string) => {
    Alert.alert('Delete Event', 'Remove this big event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = bigEvents.filter((e) => e.id !== id);
          await setSetting(db, 'big_events', JSON.stringify(updated));
          setBigEvents(updated);
          await refreshBudget(db);
          showToast('Event removed.', 'success');
        },
      },
    ]);
  };

  const handleReimport = () => {
    Alert.alert(
      'Re-import Statement',
      'This will open the import flow to add new bank statements. Your existing data is preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            useOnboardingStore.getState().reset();
            router.push('/(onboarding)/csv-upload');
          },
        },
      ],
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will restart the setup wizard. Your data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await setSetting(db, 'onboarding_completed', 'false');
            useOnboardingStore.getState().reset();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* AI Configuration */}
      <SectionCard iconName="robot-outline" title="AI Configuration">
        {apiKey ? (
          <View style={styles.apiKeyStatus}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.hint, { color: colors.success, marginBottom: 0 }]}>API key stored securely</Text>
          </View>
        ) : (
          <Text style={styles.hint}>Enter your Anthropic API key to enable the AI Critic.</Text>
        )}
        <View style={styles.row}>
          <AnimatedInput
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-ant-..."
            secureTextEntry
            autoCapitalize="none"
            style={{ flex: 1 }}
          />
          <ThemedButton title="Save" onPress={handleSaveApiKey} size="sm" />
        </View>
      </SectionCard>

      {/* Budget */}
      <SectionCard iconName="target" title="Budget">
        <View style={styles.row}>
          <AnimatedInput
            value={targetInput}
            onChangeText={setTargetInput}
            placeholder="e.g. 3000"
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
          <ThemedButton title="Update" onPress={handleSaveTarget} size="sm" />
        </View>
      </SectionCard>

      {/* Savings Goal */}
      <SectionCard iconName="piggy-bank-outline" title="Savings Goal">
        <AnimatedInput
          value={savingsNameInput}
          onChangeText={setSavingsNameInput}
          placeholder="Goal name"
        />
        <View style={[styles.row, { marginTop: spacing.sm }]}>
          <AnimatedInput
            value={savingsAmountInput}
            onChangeText={setSavingsAmountInput}
            placeholder="Amount"
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
          <ThemedButton title="Save" onPress={handleSaveSavingsGoal} size="sm" />
        </View>
      </SectionCard>

      {/* Big Events */}
      <SectionCard iconName="calendar-star-outline" title="Big Events">
        <Text style={styles.hint}>Add a one-time expense to save up for. Cost is spread daily until the event date.</Text>
        <AnimatedInput
          value={bigEventName}
          onChangeText={setBigEventName}
          placeholder="Event name (e.g. Wedding)"
        />
        <View style={[styles.row, { marginTop: spacing.sm }]}>
          <AnimatedInput
            value={bigEventAmount}
            onChangeText={setBigEventAmount}
            placeholder="Amount"
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
          <AnimatedInput
            value={bigEventDate}
            onChangeText={setBigEventDate}
            placeholder="Date (DD/MM/YYYY)"
            style={{ flex: 1 }}
          />
        </View>
        <ThemedButton
          title="Add Event"
          onPress={handleAddBigEvent}
          size="sm"
          style={{ alignSelf: 'flex-end', marginTop: spacing.sm }}
        />
        {bigEvents.map((e) => {
          const eventDate = new Date(e.date);
          const dateLabel = `${String(eventDate.getDate()).padStart(2, '0')}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${eventDate.getFullYear()}`;
          return (
            <View key={e.id} style={styles.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{e.name}</Text>
                <Text style={styles.eventAmount}>{formatNIS(e.amount)} — {dateLabel} ({formatNIS(e.amortizedDaily)}/day)</Text>
              </View>
              <Pressable
                onPress={() => handleDeleteBigEvent(e.id)}
                style={styles.eventDeleteBtn}
                hitSlop={8}
                android_ripple={Platform.OS === 'android' ? { color: colors.dangerBg, borderless: true } : undefined}
              >
                <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          );
        })}
      </SectionCard>

      {/* Data Management */}
      <SectionCard iconName="database-outline" title="Data Management">
        <ThemedButton
          title="Re-import Statement"
          onPress={handleReimport}
          variant="outline"
          icon="file-upload"
          style={{ marginBottom: spacing.md }}
        />
        <ThemedButton
          title="Reset Onboarding"
          onPress={handleResetOnboarding}
          variant="danger"
          icon="refresh"
        />
      </SectionCard>

      {/* Current Budget Info */}
      <SectionCard iconName="information-outline" title="Current Budget">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Daily Budget</Text>
          <AnimatedNumber
            value={snapshot.dailyBudget}
            prefix="₪"
            style={styles.infoValue}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wishlist Fund</Text>
          <AnimatedNumber
            value={snapshot.wishlistFund}
            prefix="₪"
            style={styles.infoValue}
          />
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  apiKeyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  eventName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  eventAmount: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xxs,
  },
  eventDeleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.circle,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.numberSmall,
    color: colors.primary,
  },
});
