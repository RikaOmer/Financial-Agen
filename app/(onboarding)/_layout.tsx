import { Stack } from 'expo-router';
import { colors } from '@/src/core/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="csv-upload" options={{ title: 'Import Statement' }} />
      <Stack.Screen name="review-commitments" options={{ title: 'Review Commitments' }} />
      <Stack.Screen name="set-target" options={{ title: 'Set Budget Target' }} />
    </Stack>
  );
}
