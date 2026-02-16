import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { runMigrations } from '@/src/core/db/migrations';
import { DATABASE_NAME } from '@/src/core/db/database';
import { runMonthTransition } from '@/src/features/budget/utils/month-transition';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettingsStore } from '@/src/stores/settings-store';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function StartupRunner() {
  const db = useSQLiteContext();
  useEffect(() => {
    runMonthTransition(db);
    useSettingsStore.getState().loadApiKey();
    useSettingsStore.getState().hydrateFromDB(db);
  }, [db]);
  return null;
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 12, color: '#64748b' }}>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={runMigrations} useSuspense>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <StartupRunner />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ title: 'Transaction History' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
