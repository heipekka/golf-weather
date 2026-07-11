import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { getStoredRoute } from '@/hooks/use-last-route';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    getStoredRoute().then((route) => setTarget(route && route !== '/' ? route : '/courses'));
  }, []);

  if (!target) return null;

  // Cast needed: the stored value is a dynamic string, not a statically typed route.
  return <Redirect href={target as Href} />;
}
