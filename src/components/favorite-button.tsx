import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export type FavoriteButtonProps = {
  courseId: string;
  size?: number;
};

// expo-symbols draws web/Android glyphs from the Material Symbols
// *Outlined* static font with no fill control, so a selected `star` there
// only changes color and never actually fills in. A Unicode star glyph
// gives a reliably solid star on those platforms; iOS keeps the native
// `star.fill` SF Symbol, which is already solid.
const USE_NATIVE_SYMBOL = Platform.OS === 'ios';

export function FavoriteButton({ courseId, size = 20 }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const theme = useTheme();
  const { t } = useI18n();
  const favorited = isFavorite(courseId);
  const color = favorited ? theme.text : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorited ? t('favorites.removeFavorite') : t('favorites.addFavorite')}
      hitSlop={Spacing.two}
      onPress={() => toggleFavorite(courseId)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {USE_NATIVE_SYMBOL ? (
        <SymbolView
          name={favorited ? { ios: 'star.fill' } : { ios: 'star' }}
          size={size}
          tintColor={color}
        />
      ) : (
        <Text style={{ color, fontSize: size, lineHeight: size }}>
          {favorited ? '\u2605' : '\u2606'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
