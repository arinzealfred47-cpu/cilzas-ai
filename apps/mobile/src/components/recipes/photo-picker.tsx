import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@clerk/expo';
import type { SavedRecipe } from './recipe-card';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export function PhotoPicker({
  onSuccess,
  onError,
}: {
  onSuccess: (recipe: SavedRecipe) => void;
  onError: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [submitting, setSubmitting] = useState(false);

  async function analyze(asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) {
      onError('Could not read image data.');
      return;
    }

    onError('');
    setSubmitting(true);

    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipe/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        onError(data.error ?? 'Something went wrong.');
        return;
      }

      onSuccess(data.recipe);
    } catch {
      onError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      onError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      analyze(result.assets[0]);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      onError('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      analyze(result.assets[0]);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, submitting && styles.buttonDisabled, pressed && styles.pressed]}
        disabled={submitting}
        onPress={pickFromGallery}
      >
        <Text style={styles.buttonText}>📁 Upload image</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.button, submitting && styles.buttonDisabled, pressed && styles.pressed]}
        disabled={submitting}
        onPress={takePhoto}
      >
        <Text style={styles.buttonText}>📷 Take a photo</Text>
      </Pressable>
      {submitting && <Text style={styles.info}>Analyzing your photo...</Text>}
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
    button: { backgroundColor: theme.bgSoft, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
    buttonDisabled: { opacity: 0.4 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    buttonText: { fontFamily: Fonts.semiBold, color: theme.text, fontSize: 14 },
    info: { fontFamily: Fonts.sans, fontSize: 13, color: theme.textMuted },
  });
}
