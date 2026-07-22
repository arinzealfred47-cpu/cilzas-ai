import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

import { GradientColors } from '@/constants/theme';
import { LanguageProvider, useLanguage } from './language-context';
import { LanguagePicker } from './language-picker';
import { ReviewsSection } from './reviews';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

function OnboardingContent() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <LanguagePicker />
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>{t.heroTitle}</Text>
          <Text style={styles.subtitle}>{t.heroSubtitle}</Text>

          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.ctaWrapper}>
              <LinearGradient
                colors={GradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{t.ctaButton}</Text>
              </LinearGradient>
            </Pressable>
          </Link>
          <Text style={styles.ctaHelper}>{t.ctaHelper}</Text>

          <Text style={styles.loginPrompt}>
            {t.loginPrompt}{' '}
            <Link href="/(auth)/sign-in" style={styles.loginLink}>
              {t.loginLink}
            </Link>
          </Text>
        </View>

        <ReviewsSection title={t.reviewsTitle} />

        <View style={styles.footer}>
          <Pressable onPress={() => openLink(`${WEB_URL}/legal`)}>
            <Text style={styles.footerLink}>{t.legalPolicy}</Text>
          </Pressable>
          <Pressable onPress={() => openLink(`${WEB_URL}/refund-policy`)}>
            <Text style={styles.footerLink}>{t.refundPolicy}</Text>
          </Pressable>
          <Pressable onPress={() => openLink(`${WEB_URL}/terms`)}>
            <Text style={styles.footerLink}>{t.termsOfService}</Text>
          </Pressable>
          <Pressable onPress={() => openLink(`${WEB_URL}/privacy`)}>
            <Text style={styles.footerLink}>{t.privacyPolicy}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function OnboardingScreen() {
  return (
    <LanguageProvider>
      <OnboardingContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  scroll: { flexGrow: 1, alignItems: 'center', gap: 32, padding: 20, paddingBottom: 48 },
  header: { width: '100%', alignItems: 'flex-end' },
  hero: { alignItems: 'center', gap: 12, maxWidth: 420 },
  title: { color: '#fff', fontSize: 30, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center' },
  ctaWrapper: { marginTop: 16 },
  cta: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999 },
  ctaText: { color: '#000', fontWeight: '700', fontSize: 14 },
  ctaHelper: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  loginPrompt: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 },
  loginLink: { color: '#fff', textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  footerLink: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
});
