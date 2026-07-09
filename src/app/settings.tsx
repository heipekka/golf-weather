import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationPicker } from '@/components/location-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { useI18n, type Language } from '@/i18n';
import type { Coordinates } from '@/lib/geo';

const LANGUAGES: { code: Language; labelKey: 'settings.finnish' | 'settings.english' }[] = [
  { code: 'fi', labelKey: 'settings.finnish' },
  { code: 'en', labelKey: 'settings.english' },
];

function formatCoordinate(coords: Coordinates): string {
  return `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
}

function LocationSection() {
  const { t } = useI18n();
  const theme = useTheme();
  const { savedLocation, setSavedLocation, clearSavedLocation } = useLocation();
  const [draft, setDraft] = useState<Coordinates | null>(savedLocation);

  const hasChanges =
    !!draft && (!savedLocation || draft.lat !== savedLocation.lat || draft.lon !== savedLocation.lon);

  return (
    <>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">{t('settings.location.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.location.description')}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {savedLocation
          ? t('settings.location.savedLabel', { coords: formatCoordinate(savedLocation) })
          : t('settings.location.notSet')}
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary">
        {t('settings.location.instruction')}
      </ThemedText>

      <LocationPicker value={draft} onChange={setDraft} />

      <View style={styles.locationActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => draft && setSavedLocation(draft)}
          disabled={!hasChanges}
          style={({ pressed }) => [
            styles.locationButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.optionPressed,
            !hasChanges && styles.locationButtonDisabled,
          ]}>
          <ThemedText type="link" themeColor="text">
            {t('settings.location.save')}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearSavedLocation();
            setDraft(null);
          }}
          disabled={!savedLocation}
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.optionPressed,
            !savedLocation && styles.locationButtonDisabled,
          ]}>
          <ThemedText type="link" themeColor="textSecondary">
            {t('settings.location.clear')}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
}

function BackButton() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={Spacing.two}
      onPress={() => router.dismissTo('/courses')}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={22}
        tintColor={theme.text}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const theme = useTheme();
  const { loading: locationLoading, source: locationSource } = useLocation();
  const showLocationSection = !locationLoading && locationSource !== 'device';

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
        <ScrollView contentContainerStyle={styles.content}>
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

          {showLocationSection && <LocationSection />}
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
  locationActions: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  locationButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  locationButtonDisabled: {
    opacity: 0.4,
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
});
