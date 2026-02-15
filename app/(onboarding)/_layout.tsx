import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="csv-upload" options={{ title: 'Import CSV' }} />
      <Stack.Screen name="review-commitments" options={{ title: 'Review Commitments' }} />
      <Stack.Screen name="set-target" options={{ title: 'Set Budget Target' }} />
    </Stack>
  );
}
