import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { WebPullToRefreshOptions, WebPullToRefreshResult } from './use-web-pull-to-refresh';

// How far (in CSS pixels) a pull must travel before it triggers a refresh,
// and the cap on how far the indicator is allowed to travel. Tuned to feel
// roughly like native `RefreshControl`.
const THRESHOLD = 64;
const MAX_PULL = 96;

// `RefreshControl` never fires `onRefresh` from a touch gesture on
// react-native-web, so pull-to-refresh needs its own DOM touch handling on
// web. Listens directly on the scrollable DOM node so it only takes over the
// gesture when that node is already scrolled to the top, and sets
// `overscroll-behavior-y: contain` so mobile browsers don't hijack the same
// gesture for their own page-reload/navigation.
export function useWebPullToRefresh({
  scrollRef,
  onRefresh,
  refreshing,
}: WebPullToRefreshOptions): WebPullToRefreshResult {
  const theme = useTheme();
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const refreshingRef = useRef(refreshing);
  const onRefreshRef = useRef(onRefresh);
  const dragRef = useRef({ startY: 0, canPull: false, dragging: false });

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const maybeNode = scrollRef.current?.getScrollableNode?.();
    if (!maybeNode) return;
    // Re-bound to a definitely-non-null const so the closures below (whose
    // calls TS can't otherwise prove happen before `maybeNode` could change)
    // retain the narrowed type.
    const node: HTMLElement = maybeNode;

    const previousOverscroll = node.style.overscrollBehaviorY;
    node.style.overscrollBehaviorY = 'contain';

    function setPullValue(value: number) {
      pullRef.current = value;
      setPull(value);
    }

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch || e.touches.length > 1) return;
      dragRef.current = { startY: touch.clientY, canPull: node.scrollTop <= 0, dragging: false };
    }

    function handleTouchMove(e: TouchEvent) {
      if (!dragRef.current.canPull || refreshingRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - dragRef.current.startY;
      if (deltaY <= 0) {
        if (pullRef.current !== 0) setPullValue(0);
        return;
      }
      dragRef.current.dragging = true;
      e.preventDefault();
      setPullValue(Math.min(MAX_PULL, deltaY * 0.5));
    }

    function handleTouchEnd() {
      if (dragRef.current.dragging && pullRef.current >= THRESHOLD && !refreshingRef.current) {
        onRefreshRef.current();
      }
      dragRef.current.dragging = false;
      setPullValue(0);
    }

    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    node.addEventListener('touchend', handleTouchEnd, { passive: true });
    node.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      node.style.overscrollBehaviorY = previousOverscroll;
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
      node.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [scrollRef]);

  const displayPull = refreshing ? THRESHOLD : pull;
  const indicator =
    displayPull > 0 ? (
      <View style={styles.container} pointerEvents="none">
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: theme.backgroundElement,
              opacity: refreshing ? 1 : Math.min(pull / THRESHOLD, 1),
              transform: [{ translateY: displayPull }],
            },
          ]}>
          <ActivityIndicator color={theme.textSecondary} size="small" />
        </View>
      </View>
    ) : null;

  return { indicator };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bubble: {
    marginTop: -Spacing.four,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
