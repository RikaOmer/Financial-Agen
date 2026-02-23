import { View, Text, StyleSheet } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { colors, typography, spacing, radius } from '@/src/core/theme';

const STEPS = [
  { route: 'csv-upload', label: 'Import' },
  { route: 'review-commitments', label: 'Review' },
  { route: 'behavioral-interview', label: 'Profile' },
  { route: 'set-target', label: 'Budget' },
];

function StepIndicator() {
  const pathname = usePathname();
  const currentRoute = pathname.split('/').pop() ?? '';
  const currentIndex = STEPS.findIndex((s) => s.route === currentRoute);
  if (currentIndex < 0) return null;

  return (
    <View style={stepStyles.container}>
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <View key={step.route} style={stepStyles.stepItem}>
            <View
              style={[
                stepStyles.dot,
                isCompleted && stepStyles.dotCompleted,
                isCurrent && stepStyles.dotCurrent,
              ]}
            >
              {isCompleted ? (
                <Text style={stepStyles.checkmark}>✓</Text>
              ) : (
                <Text style={[stepStyles.stepNum, isCurrent && stepStyles.stepNumCurrent]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                stepStyles.label,
                (isCurrent || isCompleted) && stepStyles.labelActive,
              ]}
            >
              {step.label}
            </Text>
            {i < STEPS.length - 1 && (
              <View style={[stepStyles.line, isCompleted && stepStyles.lineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.textInverse,
  },
  dotCurrent: {
    backgroundColor: colors.textInverse,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  stepNumCurrent: {
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    marginStart: spacing.xs,
  },
  labelActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.sm,
    borderRadius: 1,
  },
  lineCompleted: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        animation: 'slide_from_right',
        header: ({ options }) => (
          <View>
            <View style={{ backgroundColor: colors.primary, paddingTop: 48, paddingBottom: spacing.sm, alignItems: 'center' }}>
              <Text style={{ color: colors.textInverse, fontWeight: '600', fontSize: 17 }}>
                {options.title ?? ''}
              </Text>
            </View>
            <StepIndicator />
          </View>
        ),
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="csv-upload" options={{ title: 'Import Statement' }} />
      <Stack.Screen name="review-commitments" options={{ title: 'Review Commitments' }} />
      <Stack.Screen name="behavioral-interview" options={{ title: 'Your Financial DNA' }} />
      <Stack.Screen name="set-target" options={{ title: 'Set Budget Target' }} />
    </Stack>
  );
}
