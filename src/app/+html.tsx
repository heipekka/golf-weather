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
        <meta name="theme-color" content="#0f1f18" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golf Weather" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        <ScrollViewStyleReset />

        {/*
          Painted straight from the static HTML, before any JS has loaded, so
          there's no white flash while the bundle boots. Mirrors the photo +
          scrim + centered icon of `AnimatedSplashOverlay`/native splash
          config, and is removed by that overlay once hydration completes —
          the inline script below is only a safety net if that never fires.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #boot-splash {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #0f1f18;
                background-image: linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('/splash/backdrop.jpg');
                background-size: cover;
                background-position: center;
              }
              #boot-splash img {
                width: 200px;
                height: 200px;
              }
            `,
          }}
        />
      </head>
      <body>
        <div id="boot-splash">
          <img src="/icons/icon-192.png" alt="" width={200} height={200} />
        </div>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function () {
                var el = document.getElementById('boot-splash');
                if (el) el.remove();
              }, 8000);
            `,
          }}
        />
      </body>
    </html>
  );
}
