import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CustomModeInput, IngredientInput } from '@repo/recipes';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMPTY_ROW: IngredientInput = { name: '', quantity: 1, unit: '' };

export function CustomForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: CustomModeInput) => void;
  submitting: boolean;
}) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([{ ...EMPTY_ROW }]);
  const [servings, setServings] = useState('2');

  const valid =
    Number(servings) > 0 &&
    ingredients.length > 0 &&
    ingredients.every((i) => i.name.trim() && i.quantity > 0 && i.unit.trim());

  function updateRow(index: number, patch: Partial<IngredientInput>) {
    setIngredients((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setIngredients((rows) => [...rows, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setIngredients((rows) => rows.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!valid) return;
    onSubmit({
      mode: 'custom',
      ingredients: ingredients.map((i) => ({ ...i, name: i.name.trim(), unit: i.unit.trim() })),
      servings: Number(servings),
    });
  }

  return (
    <View style={styles.container}>
      {ingredients.map((row, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            style={styles.qtyInput}
            placeholderTextColor={theme.textFaint}
            keyboardType="decimal-pad"
            value={String(row.quantity)}
            onChangeText={(v) => updateRow(i, { quantity: Number(v) || 0 })}
          />
          <TextInput
            style={styles.unitInput}
            placeholder="unit"
            placeholderTextColor={theme.textFaint}
            value={row.unit}
            onChangeText={(v) => updateRow(i, { unit: v })}
          />
          <TextInput
            style={styles.nameInput}
            placeholder="ingredient"
            placeholderTextColor={theme.textFaint}
            value={row.name}
            onChangeText={(v) => updateRow(i, { name: v })}
          />
          <Pressable onPress={() => removeRow(i)} disabled={ingredients.length === 1}>
            <Text style={[styles.remove, ingredients.length === 1 && styles.disabled]}>✕</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addRow}>
        <Text style={styles.addLink}>+ Add ingredient</Text>
      </Pressable>

      <View style={styles.servingsRow}>
        <Text style={styles.label}>Servings</Text>
        <TextInput
          style={styles.servingsInput}
          keyboardType="number-pad"
          value={servings}
          onChangeText={setServings}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          (!valid || submitting) && styles.disabledButton,
          pressed && styles.pressed,
        ]}
        disabled={!valid || submitting}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Generate recipe</Text>
      </Pressable>
    </View>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      borderRadius: 22,
      backgroundColor: theme.bgElevated,
      padding: 14,
      gap: 10,
    },
    row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    qtyInput: {
      fontFamily: Fonts.sans,
      color: theme.text,
      width: 44,
      backgroundColor: theme.bgSoft,
      borderRadius: 10,
      padding: 8,
    },
    unitInput: {
      fontFamily: Fonts.sans,
      color: theme.text,
      width: 70,
      backgroundColor: theme.bgSoft,
      borderRadius: 10,
      padding: 8,
    },
    nameInput: {
      fontFamily: Fonts.sans,
      color: theme.text,
      flex: 1,
      backgroundColor: theme.bgSoft,
      borderRadius: 10,
      padding: 8,
    },
    remove: { fontSize: 16, color: theme.textFaint, paddingHorizontal: 4 },
    disabled: { opacity: 0.3 },
    addLink: {
      fontFamily: Fonts.sans,
      color: theme.textFaint,
      textDecorationLine: 'underline',
      fontSize: 13,
    },
    servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { fontFamily: Fonts.sans, fontSize: 13, color: theme.text },
    servingsInput: {
      fontFamily: Fonts.sans,
      color: theme.text,
      width: 60,
      backgroundColor: theme.bgSoft,
      borderRadius: 10,
      padding: 8,
    },
    submitButton: { backgroundColor: '#86F0C6', borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
    disabledButton: { opacity: 0.4 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    submitText: { fontFamily: Fonts.semiBold, color: '#0C2119', fontSize: 14 },
  });
}
