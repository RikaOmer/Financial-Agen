import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius, spacing, shadows, durations } from '@/src/core/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastMeta: Record<ToastType, { color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  success: { color: colors.success, bg: colors.successBg, icon: 'check-circle' },
  error: { color: colors.danger, bg: colors.dangerBg, icon: 'error' },
  warning: { color: colors.warning, bg: colors.warningBg, icon: 'warning' },
  info: { color: colors.primary, bg: colors.primaryBg, icon: 'info' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast({ message, type, duration });
      slideAnim.setValue(-100);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: durations.normal,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: durations.fast,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, duration);
    },
    [slideAnim],
  );

  const meta = toast ? toastMeta[toast.type] : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && meta && (
        <Animated.View
          style={[
            styles.toast,
            {
              top: insets.top + spacing.sm,
              backgroundColor: meta.bg,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.bar, { backgroundColor: meta.color }]} />
          <MaterialIcons name={meta.icon} size={20} color={meta.color} style={styles.icon} />
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.lg,
    zIndex: 9999,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  icon: {
    marginStart: spacing.sm,
    marginEnd: spacing.sm,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
});
