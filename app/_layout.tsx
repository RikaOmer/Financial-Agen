import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { runMigrations } from '@/src/core/db/migrations';
import { DATABASE_NAME } from '@/src/core/db/database';
import { runMonthTransition } from '@/src/features/budget/utils/month-transition';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettingsStore } from '@/src/stores/settings-store';
import { useBehavioralStore } from '@/src/stores/behavioral-store';
import { ToastProvider } from '@/src/components/Toast';
import { LoadingSkeleton } from '@/src/components/LoadingSkeleton';
import { colors, shadows, spacing } from '@/src/core/theme';

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
    useBehavioralStore.getState().loadBehavioralContext(db);
  }, [db]);
  return null;
}

function LoadingFallback() {
  return (
    <View style={loadingStyles.container}>
      <MaterialCommunityIcons
        name="wallet-outline"
        size={48}
        color={colors.textDisabled}
        style={loadingStyles.icon}
      />
      <LoadingSkeleton preset="text" width={180} style={loadingStyles.skeleton} />
      <LoadingSkeleton preset="text" width={120} />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  icon: {
    marginBottom: spacing.xl,
  },
  skeleton: {
    marginBottom: spacing.sm,
  },
});

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
          <ToastProvider>
            <StatusBar style="dark" />
            <StartupRunner />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="history"
                options={{
                  title: 'Transaction History',
                  animation: 'slide_from_bottom',
                  headerStyle: {
                    backgroundColor: colors.surface,
                    ...shadows.sm,
                  },
                  headerShadowVisible: false,
                  headerTitleStyle: {
                    fontWeight: '600',
                    color: colors.textPrimary,
                  },
                  headerTintColor: colors.primary,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ToastProvider>
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
