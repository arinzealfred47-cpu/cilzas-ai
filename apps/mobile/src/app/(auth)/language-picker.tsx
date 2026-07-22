import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LANGUAGES, findLanguage, type Language } from '@repo/i18n';
import { useLanguage } from './language-context';

export function LanguagePicker() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = findLanguage(locale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q),
    );
  }, [query]);

  function selectLanguage(code: string) {
    setLocale(code);
    setOpen(false);
    setQuery('');
  }

  function renderItem({ item }: { item: Language }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => selectLanguage(item.code)}
      >
        <Text style={[styles.rowText, item.code === locale && styles.rowTextActive]}>
          {item.name}
        </Text>
        <Text style={styles.rowNative}>{item.nativeName}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerText}>
          {current?.name ?? 'English'} ({current?.nativeName})
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <TextInput
            autoFocus
            style={styles.search}
            placeholder={t.languageSearchPlaceholder}
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={() => setOpen(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  triggerText: { color: '#fff', fontSize: 13 },
  modal: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 16 },
  search: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowText: { color: '#fff', fontSize: 14 },
  rowTextActive: { color: '#60EFFF' },
  rowNative: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  closeButton: { paddingVertical: 16, alignItems: 'center' },
  closeButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  pressed: { opacity: 0.8 },
});
