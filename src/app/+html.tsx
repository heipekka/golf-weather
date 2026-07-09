import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML for the static web export. Only used when building for web
 * (`expo export -p web`); does not affect native. This is where PWA
 * install metadata (manifest, icons, theme color) is wired up, since
 * Expo Router/Metro does not generate a PWA manifest automatically.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#208AEF" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golf Weather" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
