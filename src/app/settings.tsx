import Slider from '@react-native-community/slider';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { LocationPicker } from '@/components/location-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
import { useDistanceFilter } from '@/hooks/use-distance-filter';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode, type ThemeMode } from '@/hooks/use-theme-mode';
import { useI18n, type Language } from '@/i18n';
import type { Coordinates } from '@/lib/geo';

const MIN_DISTANCE_KM = 30;
const MAX_DISTANCE_KM = 700;
const DISTANCE_STEP_KM = 10;

const LANGUAGES: {
  code: Language;
  labelKey:
    | 'settings.finnish'
    | 'settings.english'
    | 'settings.swedish'
    | 'settings.norwegian'
    | 'settings.estonian'
    | 'settings.lithuanian'
    | 'settings.latvian'
    | 'settings.danish';
}[] = [
  { code: 'fi', labelKey: 'settings.finnish' },
  { code: 'en', labelKey: 'settings.english' },
  { code: 'sv', labelKey: 'settings.swedish' },
  { code: 'no', labelKey: 'settings.norwegian' },
  { code: 'et', labelKey: 'settings.estonian' },
  { code: 'lt', labelKey: 'settings.lithuanian' },
  { code: 'lv', labelKey: 'settings.latvian' },
  { code: 'da', labelKey: 'settings.danish' },
];

const THEME_MODES: {
  mode: ThemeMode;
  labelKey: 'settings.theme.system' | 'settings.theme.light' | 'settings.theme.dark';
}[] = [
  { mode: 'system', labelKey: 'settings.theme.system' },
  { mode: 'light', labelKey: 'settings.theme.light' },
  { mode: 'dark', labelKey: 'settings.theme.dark' },
];

type SettingsTab = 'user' | 'search';

const SETTINGS_TABS: { id: SettingsTab; labelKey: 'settings.tabs.user' | 'settings.tabs.search' }[] = [
  { id: 'user', labelKey: 'settings.tabs.user' },
  { id: 'search', labelKey: 'settings.tabs.search' },
];

function formatCoords(coords: Coordinates): string {
  return `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
}

function SettingsTabControl({ value, onChange }: { value: SettingsTab; onChange: (tab: SettingsTab) => void }) {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.background, borderBottomColor: theme.backgroundElement }]}>
      <View style={styles.tabBarInner}>
        {SETTINGS_TABS.map(({ id, labelKey }) => {
          const isSelected = id === value;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(id)}
              style={({ pressed }) => [
                styles.tabItem,
                { borderBottomColor: isSelected ? theme.text : 'transparent' },
                pressed && styles.optionPressed,
              ]}>
              <ThemedText type="smallBold" themeColor={isSelected ? 'text' : 'textSecondary'}>
                {t(labelKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LanguageSection() {
  const { t, language, setLanguage } = useI18n();
  const theme = useTheme();

  return (
    <>
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
    </>
  );
}

function ThemeSection() {
  const { t } = useI18n();
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('settings.theme.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.theme.description')}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.optionList}>
        {THEME_MODES.map(({ mode, labelKey }, index) => {
          const selected = mode === themeMode;
          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => setThemeMode(mode)}
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
    </>
  );
}

function DarkScoringSection() {
  const { t } = useI18n();
  const { darkScoringEnabled, setDarkScoringEnabled } = useDarkScoring();

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('settings.darkScoring.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.darkScoring.description')}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.optionList}>
        <View style={styles.option}>
          <ThemedText type="default">{t('settings.darkScoring.toggle')}</ThemedText>
          <Switch value={darkScoringEnabled} onValueChange={setDarkScoringEnabled} />
        </View>
      </ThemedView>
    </>
  );
}

function DefaultLocationSection() {
  const { t } = useI18n();
  const { savedLocation, setSavedLocation, clearSavedLocation } = useLocation();

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('settings.location.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.location.description')}
        </ThemedText>
      </View>

      <LocationPicker value={savedLocation} onChange={setSavedLocation} />

      <ThemedText type="small" themeColor="textSecondary">
        {savedLocation
          ? t('settings.location.savedLabel', { coords: formatCoords(savedLocation) })
          : t('settings.location.notSet')}
      </ThemedText>

      <View style={styles.locationActions}>
        <Pressable
          accessibilityRole="button"
          disabled={!savedLocation}
          onPress={clearSavedLocation}
          style={({ pressed }) => [styles.locationButton, pressed && styles.optionPressed]}>
          <ThemedText type="link" themeColor="textSecondary">
            {t('settings.location.clear')}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
}

function DistanceRangeSection() {
  const { t } = useI18n();
  const theme = useTheme();
  const { maxDistanceKm, setMaxDistanceKm } = useDistanceFilter();
  const [liveKm, setLiveKm] = useState(maxDistanceKm);
  // Tracks the last value derived from context so the label can be
  // re-synced (adjusting state during render, per React's guidance) if the
  // saved value loads asynchronously after mount, without fighting live drags.
  const [lastKnownKm, setLastKnownKm] = useState(maxDistanceKm);
  if (lastKnownKm !== maxDistanceKm) {
    setLastKnownKm(maxDistanceKm);
    setLiveKm(maxDistanceKm);
  }

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('distance.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('distance.description')}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.distanceCard}>
        <ThemedText type="smallBold" style={styles.valueLabel}>
          {t('distance.label').replace('{km}', String(liveKm))}
        </ThemedText>

        <Slider
          style={styles.slider}
          minimumValue={MIN_DISTANCE_KM}
          maximumValue={MAX_DISTANCE_KM}
          step={DISTANCE_STEP_KM}
          value={maxDistanceKm}
          onValueChange={setLiveKm}
          onSlidingComplete={setMaxDistanceKm}
          minimumTrackTintColor={theme.text}
          maximumTrackTintColor={theme.textSecondary}
          thumbTintColor={theme.text}
        />

        <View style={styles.rangeRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {MIN_DISTANCE_KM} km
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {MAX_DISTANCE_KM} km
          </ThemedText>
        </View>
      </ThemedView>
    </>
  );
}

export default function SettingsScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<SettingsTab>('user');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('settings.title'),
          headerTitleAlign: 'center',
          headerLeft: () => <BackButton accessibilityLabel="Back" fallbackHref="/courses" />,
          headerLeftContainerStyle: styles.headerSideContainer,
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <SettingsTabControl value={tab} onChange={setTab} />
        <ScrollView contentContainerStyle={styles.content}>
          {tab === 'user' ? (
            <>
              <LanguageSection />
              <ThemeSection />
            </>
          ) : (
            <>
              <DarkScoringSection />
              <DefaultLocationSection />
              <DistanceRangeSection />
            </>
          )}
        </ScrollView>
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
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
  tabBar: {
    width: '100%',
    borderBottomWidth: 1,
  },
  tabBarInner: {
    flexDirection: 'row',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  locationActions: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  locationButton: {
    paddingVertical: Spacing.one,
  },
  distanceCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  valueLabel: {
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.two,
  },
});
