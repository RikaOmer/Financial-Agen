import React, { useRef, useCallback, useState } from 'react';
import { View, Text, Animated, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors, typography, spacing, durations } from '@/src/core/theme';
import { ThemedButton } from '@/src/components/ThemedButton';
import { useBehavioralStore } from '@/src/stores/behavioral-store';
import { InterviewProgress } from '@/src/features/behavioral/components/InterviewProgress';
import { SemanticSummaryCard } from '@/src/features/behavioral/components/SemanticSummaryCard';
import { SocialFilterStep } from '@/src/features/behavioral/components/SocialFilterStep';
import { EmotionalRoiStep } from '@/src/features/behavioral/components/EmotionalRoiStep';
import { ConstraintStep } from '@/src/features/behavioral/components/ConstraintStep';
import type { InterviewAnswer } from '@/src/types/behavioral';

export default function BehavioralInterviewScreen() {
  const db = useSQLiteContext();
  const [finalizing, setFinalizing] = useState(false);

  const analysisResult = useBehavioralStore((s) => s.analysisResult);
  const questions = useBehavioralStore((s) => s.questions);
  const currentQuestionIndex = useBehavioralStore((s) => s.currentQuestionIndex);
  const answerQuestion = useBehavioralStore((s) => s.answerQuestion);
  const goBack = useBehavioralStore((s) => s.goBack);
  const finalizeInterview = useBehavioralStore((s) => s.finalizeInterview);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isComplete = currentQuestionIndex >= questions.length;
  const currentQuestion = !isComplete ? questions[currentQuestionIndex] : null;

  const animateTransition = useCallback(
    (direction: 'forward' | 'backward', callback: () => void) => {
      const exitOffset = direction === 'forward' ? -30 : 30;
      const enterOffset = direction === 'forward' ? 30 : -30;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: durations.fast,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: exitOffset,
          duration: durations.fast,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        slideAnim.setValue(enterOffset);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: durations.normal,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: durations.normal,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  const handleAnswer = useCallback(
    (answer: InterviewAnswer) => {
      animateTransition('forward', () => {
        answerQuestion(answer);
      });
    },
    [animateTransition, answerQuestion],
  );

  const handleBack = useCallback(() => {
    if (currentQuestionIndex <= 0) return;
    animateTransition('backward', () => {
      goBack();
    });
  }, [animateTransition, goBack, currentQuestionIndex]);

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      await finalizeInterview(db);
      router.push('/(onboarding)/set-target');
    } catch {
      // If finalization fails, still proceed to not block onboarding
      router.push('/(onboarding)/set-target');
    }
  }, [finalizeInterview, db]);

  const handleSkip = useCallback(() => {
    router.push('/(onboarding)/set-target');
  }, []);

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'social_filter':
        return (
          <SocialFilterStep
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'emotional_roi':
        return (
          <EmotionalRoiStep
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'constraint_confirm':
        return (
          <ConstraintStep
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      default:
        return null;
    }
  };

  // Completion state
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>All done!</Text>
          <Text style={styles.completeBody}>
            Your financial DNA has been captured. We will use these preferences to give you
            more personalized budget advice.
          </Text>
          <ThemedButton
            title="Set Budget Target"
            onPress={handleFinalize}
            variant="primary"
            size="lg"
            icon="arrow-forward"
            loading={finalizing}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {analysisResult && <SemanticSummaryCard analysis={analysisResult} />}

        <InterviewProgress current={currentQuestionIndex} total={questions.length} />

        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderQuestion()}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <ThemedButton
          title="Back"
          onPress={handleBack}
          variant="ghost"
          size="md"
          icon="arrow-back"
          disabled={currentQuestionIndex <= 0}
        />
        <ThemedButton
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  questionContainer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  completeTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completeBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
