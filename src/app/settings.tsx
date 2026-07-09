import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n, type Language } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { clearUsageLog, readUsageLog, summarizeUsage, type UsageLog, type UsageSummary } from '@/lib/usage-log';

const LANGUAGES: { code: Language; labelKey: 'settings.finnish' | 'settings.english' }[] = [
  { code: 'fi', labelKey: 'settings.finnish' },
  { code: 'en', labelKey: 'settings.english' },
];

function BackButton() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={Spacing.two}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={22}
        tintColor={theme.text}
      />
    </Pressable>
  );
}

function UsageSection() {
  const { t, locale } = useI18n();
  const [log, setLog] = useState<UsageLog | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadLog = useCallback(() => {
    readUsageLog()
      .then(setLog)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const summary: UsageSummary | null = log ? summarizeUsage(log) : null;

  const handleExport = useCallback(async () => {
    if (!log) return;
    setStatus(null);
    const payload = JSON.stringify(log, null, 2);

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setStatus(t('usage.exported'));
        return;
      }
      await Share.share({ message: payload });
      setStatus(t('usage.shared'));
    } catch {
      // Ignore share sheet cancellations or unsupported browsers.
    }
  }, [log, t]);

  const handleReset = useCallback(() => {
    clearUsageLog().then(loadLog);
    setStatus(null);
  }, [loadLog]);

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('usage.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('usage.description')}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.usageCard}>
        {!summary || summary.totalSessions === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('usage.empty')}
          </ThemedText>
        ) : (
          <>
            <View style={styles.usageStatsGrid}>
              <UsageStat label={t('usage.totalSessions')} value={String(summary.totalSessions)} />
              <UsageStat label={t('usage.distinctUsers')} value={String(summary.distinctUsers)} />
              <UsageStat label={t('usage.distinctFingerprints')} value={String(summary.distinctFingerprints)} />
              <UsageStat label={t('usage.firstSeen')} value={formatDateTime(summary.firstSeen, locale)} />
              <UsageStat label={t('usage.lastSeen')} value={formatDateTime(summary.lastSeen, locale)} />
            </View>

            <View style={styles.usageRecentHeading}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('usage.recent')}
              </ThemedText>
            </View>
            <ScrollView style={styles.usageRecentList}>
              {summary.recent.map((session, index) => (
                <ThemedText key={`${session.at}-${index}`} type="small" style={styles.usageRecentRow}>
                  {formatDateTime(session.at, locale)}
                </ThemedText>
              ))}
            </ScrollView>
          </>
        )}
      </ThemedView>

      <View style={styles.usageActions}>
        <Pressable
          accessibilityRole="button"
          onPress={handleExport}
          disabled={!log || log.sessions.length === 0}
          style={({ pressed }) => [styles.usageButton, pressed && styles.optionPressed]}>
          <ThemedText type="link" themeColor="text">
            {t('usage.export')}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleReset}
          disabled={!log || log.sessions.length === 0}
          style={({ pressed }) => [styles.usageButton, pressed && styles.optionPressed]}>
          <ThemedText type="link" themeColor="textSecondary">
            {t('usage.reset')}
          </ThemedText>
        </Pressable>
      </View>

      {status && (
        <ThemedText type="small" themeColor="textSecondary">
          {status}
        </ThemedText>
      )}
    </>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.usageStat}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.title'),
          headerTitleAlign: 'center',
          headerLeft: () => <BackButton />,
          headerLeftContainerStyle: styles.headerSideContainer,
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold">{t('settings.language')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('settings.languageDescription')}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.optionList}>
            {LANGUAGES.map(({ code, labelKey }, index) => {
              const selected = code === language;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  onPress={() => setLanguage(code)}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && styles.optionBorder,
                    { borderColor: theme.background },
                    pressed && styles.optionPressed,
                  ]}>
                  <ThemedText type="default" themeColor={selected ? 'text' : 'textSecondary'}>
                    {t(labelKey)}
                  </ThemedText>
                  {selected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={18}
                      tintColor={theme.text}
                    />
                  )}
                </Pressable>
              );
            })}
          </ThemedView>

          <UsageSection />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeading: {
    gap: Spacing.half,
  },
  optionList: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  optionBorder: {
    borderTopWidth: 1,
  },
  optionPressed: {
    opacity: 0.7,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
  usageCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  usageStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  usageStat: {
    minWidth: 120,
    gap: Spacing.half,
  },
  usageRecentHeading: {
    gap: Spacing.half,
  },
  usageRecentList: {
    maxHeight: 160,
  },
  usageRecentRow: {
    paddingVertical: Spacing.half,
  },
  usageActions: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  usageButton: {
    paddingVertical: Spacing.one,
  },
});
