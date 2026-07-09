import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'golf-weather.favorites';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (courseId: string) => boolean;
  toggleFavorite: (courseId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored);
        if (isStringArray(parsed)) setFavorites(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = useCallback((courseId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((courseId: string) => favorites.includes(courseId), [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
