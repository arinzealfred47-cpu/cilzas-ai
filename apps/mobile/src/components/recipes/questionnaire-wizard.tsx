import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { QuestionnaireModeInput } from '@repo/recipes';

import { Colors, Fonts } from '@/constants/theme';

type Answers = {
  timeOfDay: string;
  needsHealthy: boolean | null;
  eatingAlone: boolean | null;
  partySize: string;
  allergies: string;
  dietType: 'none' | 'vegan' | 'vegetarian' | null;
  dietaryRestrictions: string;
};

const EMPTY_ANSWERS: Answers = {
  timeOfDay: '',
  needsHealthy: null,
  eatingAlone: null,
  partySize: '',
  allergies: '',
  dietType: null,
  dietaryRestrictions: '',
};

function isStepAnswered(step: number, a: Answers): boolean {
  switch (step) {
    case 0:
      return a.timeOfDay.trim().length > 0;
    case 1:
      return a.needsHealthy !== null;
    case 2:
      return a.eatingAlone !== null && (a.eatingAlone || a.partySize.trim().length > 0);
    case 3:
      return a.allergies.trim().length > 0;
    case 4:
      return a.dietType !== null;
    case 5:
      return a.dietaryRestrictions.trim().length > 0;
    default:
      return false;
  }
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.choiceRow}>
      <Pressable
        style={({ pressed }) => [
          styles.choiceButton,
          value === true && styles.choiceButtonActive,
          pressed && styles.pressed,
        ]}
        onPress={() => onChange(true)}
      >
        <Text style={value === true ? styles.choiceTextActive : styles.choiceText}>Yes</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.choiceButton,
          value === false && styles.choiceButtonActive,
          pressed && styles.pressed,
        ]}
        onPress={() => onChange(false)}
      >
        <Text style={value === false ? styles.choiceTextActive : styles.choiceText}>No</Text>
      </Pressable>
    </View>
  );
}

export function QuestionnaireWizard({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: QuestionnaireModeInput) => void;
  submitting: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const totalSteps = 6;
  const answered = isStepAnswered(step, answers);

  function next() {
    if (step === totalSteps - 1) {
      onSubmit({
        mode: 'questionnaire',
        timeOfDay: answers.timeOfDay.trim(),
        needsHealthy: answers.needsHealthy === true,
        eatingAlone: answers.eatingAlone === true,
        partySize: answers.eatingAlone ? undefined : Number(answers.partySize),
        allergies: answers.allergies.trim(),
        dietType: answers.dietType ?? 'none',
        dietaryRestrictions: answers.dietaryRestrictions.trim(),
      });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Question {step + 1} of {totalSteps}
      </Text>

      {step === 0 && (
        <View style={styles.field}>
          <Text style={styles.question}>What time of the day is it?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. morning, 7pm, lunchtime"
            placeholderTextColor={Colors.dark.textSecondary}
            value={answers.timeOfDay}
            onChangeText={(v) => setAnswers((a) => ({ ...a, timeOfDay: v }))}
          />
        </View>
      )}

      {step === 1 && (
        <View style={styles.field}>
          <Text style={styles.question}>Does the food/dish need to be healthy?</Text>
          <YesNo value={answers.needsHealthy} onChange={(v) => setAnswers((a) => ({ ...a, needsHealthy: v }))} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.field}>
          <Text style={styles.question}>Are you eating alone?</Text>
          <YesNo
            value={answers.eatingAlone}
            onChange={(v) => setAnswers((a) => ({ ...a, eatingAlone: v, partySize: v ? '' : a.partySize }))}
          />
          {answers.eatingAlone === false && (
            <View style={styles.field}>
              <Text style={styles.question}>How many people are eating this food/dish?</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="number-pad"
                value={answers.partySize}
                onChangeText={(v) => setAnswers((a) => ({ ...a, partySize: v }))}
              />
            </View>
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.field}>
          <Text style={styles.question}>Are you allergic to anything?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. peanuts, shellfish, or 'none'"
            placeholderTextColor={Colors.dark.textSecondary}
            value={answers.allergies}
            onChangeText={(v) => setAnswers((a) => ({ ...a, allergies: v }))}
          />
        </View>
      )}

      {step === 4 && (
        <View style={styles.field}>
          <Text style={styles.question}>Are you a vegan/vegetarian?</Text>
          <View style={styles.choiceRow}>
            {(['none', 'vegetarian', 'vegan'] as const).map((v) => (
              <Pressable
                key={v}
                style={({ pressed }) => [
                  styles.choiceButton,
                  answers.dietType === v && styles.choiceButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setAnswers((a) => ({ ...a, dietType: v }))}
              >
                <Text style={answers.dietType === v ? styles.choiceTextActive : styles.choiceText}>
                  {v === 'none' ? 'Neither' : v}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 5 && (
        <View style={styles.field}>
          <Text style={styles.question}>Do you have any dietary restrictions? If so, name them.</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. gluten-free, low-sodium, or 'none'"
            placeholderTextColor={Colors.dark.textSecondary}
            value={answers.dietaryRestrictions}
            onChangeText={(v) => setAnswers((a) => ({ ...a, dietaryRestrictions: v }))}
          />
        </View>
      )}

      <View style={styles.nav}>
        <Pressable onPress={back} disabled={step === 0}>
          <Text style={[styles.backText, step === 0 && styles.disabled]}>Back</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            (!answered || submitting) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          disabled={!answered || submitting}
          onPress={next}
        >
          <Text style={styles.nextText}>{step === totalSteps - 1 ? 'Generate recipe' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  progress: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.dark.textSecondary },
  field: { gap: 8 },
  question: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.dark.text },
  input: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 10,
  },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  choiceButtonActive: { backgroundColor: '#00FF87', borderColor: '#00FF87' },
  choiceText: { fontFamily: Fonts.sans, fontSize: 13, textTransform: 'capitalize', color: Colors.dark.text },
  choiceTextActive: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#000', textTransform: 'capitalize' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  backText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.textSecondary },
  disabled: { opacity: 0.3 },
  nextButton: { backgroundColor: '#00FF87', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  disabledButton: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  nextText: { fontFamily: Fonts.semiBold, color: '#000', fontSize: 13 },
});
