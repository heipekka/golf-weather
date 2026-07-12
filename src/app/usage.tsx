import { Redirect, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { isUsageUnlocked, setUsageUnlocked, verifyUsagePassword } from '@/lib/usage-auth';
import { clearUsageLog, readUsageLog, summarizeUsage, type UsageLog, type UsageSummary } from '@/lib/usage-log';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useI18n();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = useCallback(async () => {
    setChecking(true);
    setError(false);
    try {
      const ok = await verifyUsagePassword(password);
      if (ok) {
        setUsageUnlocked(true);
        onUnlock();
      } else {
        setError(true);
      }
    } finally {
      setChecking(false);
    }
  }, [password, onUnlock]);

  return (
    <View style={styles.gate}>
      <ThemedText type="smallBold">{t('usage.passwordPrompt')}</ThemedText>
      <TextInput
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setError(false);
        }}
        placeholder={t('usage.passwordPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        autoFocus
        onSubmitEditing={handleSubmit}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
      />
      {error && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('usage.wrongPassword')}
        </ThemedText>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        disabled={checking || password.length === 0}
        style={({ pressed }) => [styles.unlockButton, { backgroundColor: theme.backgroundElement }, pressed && styles.optionPressed]}>
        <ThemedText type="link" themeColor="text">
          {t('usage.unlock')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function UsageContent() {
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

export default function UsageScreen() {
  const { t } = useI18n();
  const [unlocked, setUnlocked] = useState(() => isUsageUnlocked());

  if (Platform.OS !== 'web') {
    return <Redirect href="/courses" />;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('usage.title'),
          headerTitleAlign: 'center',
          headerLeft: () => <BackButton accessibilityLabel="Back" fallbackHref="/courses" />,
          headerLeftContainerStyle: styles.headerSideContainer,
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          {unlocked ? <UsageContent /> : <PasswordGate onUnlock={() => setUnlocked(true)} />}
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
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
  gate: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  unlockButton: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  optionPressed: {
    opacity: 0.7,
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
