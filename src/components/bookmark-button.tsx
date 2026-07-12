import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { floorToHour, useBookmarks } from '@/hooks/use-bookmarks';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export type BookmarkButtonProps = {
  courseId: string;
  datetime: Date;
  size?: number;
};

export function BookmarkButton({ courseId, datetime, size = 20 }: BookmarkButtonProps) {
  const { hasBookmark, addBookmark, removeBookmark, bookmarks } = useBookmarks();
  const theme = useTheme();
  const { t } = useI18n();
  const bookmarked = hasBookmark(courseId, datetime);
  const color = bookmarked ? theme.text : theme.textSecondary;

  function handlePress() {
    if (bookmarked) {
      const flooredTime = floorToHour(datetime).getTime();
      const existing = bookmarks.find(
        (bookmark) =>
          bookmark.courseId === courseId && new Date(bookmark.datetime).getTime() === flooredTime
      );
      if (existing) removeBookmark(existing.id);
    } else {
      addBookmark(courseId, datetime);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
      hitSlop={Spacing.two}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
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
