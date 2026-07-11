import type { ReactNode, RefObject } from 'react';

export type ScrollableRef = RefObject<{ getScrollableNode?: () => HTMLElement | null } | null>;

export type WebPullToRefreshOptions = {
  scrollRef: ScrollableRef;
  onRefresh: () => void;
  refreshing: boolean;
};

export type WebPullToRefreshResult = {
  indicator: ReactNode;
};

// Native relies on `RefreshControl`'s own pull gesture, so this is a no-op
// here. See `use-web-pull-to-refresh.web.tsx` for the web implementation.
export function useWebPullToRefresh(_options: WebPullToRefreshOptions): WebPullToRefreshResult {
  return { indicator: null };
}
