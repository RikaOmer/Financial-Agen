import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';

const FEATURES = [
  { icon: 'magnify' as const, text: 'Import bank statements to understand your habits' },
  { icon: 'repeat' as const, text: 'Automatically detect subscriptions & installments' },
  { icon: 'robot' as const, text: 'AI coach that helps you decide before you buy' },
];

export default function WelcomeScreen() {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(-20)).current;

  const featureAnims = useRef(
    FEATURES.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-20),
    })),
  ).current;

  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Hero entrance
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered feature rows
    Animated.stagger(
      150,
      featureAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();

    // Buttons delayed entrance
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] },
        ]}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="wallet-outline" size={80} color={colors.primary} />
        </View>
        <Text style={styles.title}>Financial Twin</Text>
        <Text style={styles.subtitle}>
          Spend less on things that don't matter.{'\n'}Save more for things that do.
        </Text>
      </Animated.View>

      <View style={styles.features}>
        {FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.icon}
            style={{
              opacity: featureAnims[index].opacity,
              transform: [{ translateX: featureAnims[index].translateX }],
            }}
          >
            <ThemedCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </ThemedCard>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        style={[
          styles.actions,
          { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] },
        ]}
      >
        <ThemedButton
          title="Get Started"
          onPress={() => router.push('/(onboarding)/csv-upload')}
          variant="primary"
          size="lg"
        />
        <ThemedButton
          title="I don't have a CSV — set budget manually"
          onPress={() => router.push('/(onboarding)/set-target')}
          variant="ghost"
          size="lg"
          style={styles.skipButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  features: {
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  featureCard: {
    ...shadows.sm,
    padding: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
    marginStart: spacing.md,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  skipButton: {
    marginTop: 0,
  },
});
