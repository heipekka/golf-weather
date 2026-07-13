import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

import { ThemedText } from './themed-text';

export type BookmarkButtonProps = {
  courseId: string;
  datetime: Date;
  size?: number;
  /** When true, shows an "Add my tee" text label next to the icon. */
  showLabel?: boolean;
};

/** Adds this course/datetime to My tee times. Hidden once it's already there — remove from the My tee times list instead. */
export function BookmarkButton({ courseId, datetime, size = 20, showLabel }: BookmarkButtonProps) {
  const { hasBookmark, addBookmark } = useBookmarks();
  const theme = useTheme();
  const { t } = useI18n();
  const bookmarked = hasBookmark(courseId, datetime);
  const color = theme.textSecondary;

  if (bookmarked) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('bookmarks.addMyTee')}
      hitSlop={Spacing.two}
      onPress={() => addBookmark(courseId, datetime)}
      style={({ pressed }) => [
        styles.button,
        showLabel && styles.buttonWithLabel,
        pressed && styles.pressed,
      ]}
    >
      {showLabel && (
        <ThemedText type="small" style={{ color }}>
          {t('bookmarks.addMyTee')}
        </ThemedText>
      )}
      <SymbolView
        name={{ ios: 'figure.golf.circle', android: 'sports_golf', web: 'sports_golf' }}
        size={size}
        tintColor={color}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
