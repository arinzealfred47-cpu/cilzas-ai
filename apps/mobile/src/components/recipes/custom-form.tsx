import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CustomModeInput, IngredientInput } from '@repo/recipes';

import { Colors, Fonts } from '@/constants/theme';

const EMPTY_ROW: IngredientInput = { name: '', quantity: 1, unit: '' };

export function CustomForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: CustomModeInput) => void;
  submitting: boolean;
}) {
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
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="decimal-pad"
            value={String(row.quantity)}
            onChangeText={(v) => updateRow(i, { quantity: Number(v) || 0 })}
          />
          <TextInput
            style={styles.unitInput}
            placeholder="unit"
            placeholderTextColor={Colors.dark.textSecondary}
            value={row.unit}
            onChangeText={(v) => updateRow(i, { unit: v })}
          />
          <TextInput
            style={styles.nameInput}
            placeholder="ingredient"
            placeholderTextColor={Colors.dark.textSecondary}
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

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  qtyInput: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    width: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 8,
  },
  unitInput: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    width: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 8,
  },
  nameInput: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 8,
  },
  remove: { fontSize: 16, color: Colors.dark.textSecondary, paddingHorizontal: 4 },
  disabled: { opacity: 0.3 },
  addLink: {
    fontFamily: Fonts.sans,
    color: Colors.dark.textSecondary,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.text },
  servingsInput: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    width: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 8,
  },
  submitButton: { backgroundColor: '#00FF87', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  disabledButton: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitText: { fontFamily: Fonts.semiBold, color: '#000', fontSize: 14 },
});
