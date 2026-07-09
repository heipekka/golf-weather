export { useColorScheme } from 'react-native';

/**
 * On native there's no static-rendering/hydration gap, so this is always true.
 */
export function useHasHydrated() {
  return true;
}
