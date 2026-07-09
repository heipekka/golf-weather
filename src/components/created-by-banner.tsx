import { openURL } from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';

// Split so the address never appears as a single literal in source or in
// the rendered output — it's only ever assembled at press time.
const EMAIL_USER = ['pekka'];
const EMAIL_DOMAIN = ['heipekka', 'net'];

function handleContact() {
  const address = `${EMAIL_USER.join('')}@${EMAIL_DOMAIN.join('.')}`;
  openURL(`mailto:${address}`).catch(() => {});
}

export function CreatedByBanner() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('createdBy.credit')}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('createdBy.contact')}
        onPress={handleContact}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('createdBy.contact')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
