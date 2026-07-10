import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Spacing } from '@/constants/theme';
import type { Coordinates } from '@/lib/geo';

export type LocationPickerProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

// Finland-centered default view, matching the web picker, so the map is
// useful even before a location is picked.
const DEFAULT_CENTER: Coordinates = { lat: 64.5, lon: 26 };
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 6;
const MAP_HEIGHT = 260;

// No native map SDK is bundled, so this renders a Leaflet/OpenStreetMap page
// (loaded from a CDN, same tiles as the web picker) inside a WebView. Taps
// are relayed back to React Native via postMessage; there is no text entry,
// picking only happens by tapping the map.
function buildMapHtml(initial: Coordinates | null): string {
  const center = initial ?? DEFAULT_CENTER;
  const zoom = initial ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center.lat}, ${center.lon}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'location-picker-pin',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#208AEF;border:2px solid #ffffff;box-shadow:0 0 4px rgba(0,0,0,0.45);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    var marker = ${initial ? `L.marker([${initial.lat}, ${initial.lon}], { icon: pinIcon }).addTo(map)` : 'null'};

    function placeMarker(lat, lon) {
      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon], { icon: pinIcon }).addTo(map);
      }
    }

    map.on('click', function (event) {
      placeMarker(event.latlng.lat, event.latlng.lng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: event.latlng.lat, lon: event.latlng.lng }));
      }
    });

    window.setPin = function (lat, lon) {
      placeMarker(lat, lon);
      map.setView([lat, lon], ${SELECTED_ZOOM});
    };
    window.clearPin = function () {
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
    };
  </script>
</body>
</html>`;
}

function coordsEqual(a: Coordinates | null, b: Coordinates | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.lat === b.lat && a.lon === b.lon;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const webViewRef = useRef<WebView>(null);
  const lastEmittedRef = useRef<Coordinates | null>(value);
  const [html] = useState(() => buildMapHtml(value));

  // Reflects changes that came from outside this component (e.g. the saved
  // location loading asynchronously, or the settings screen's Clear button)
  // by imperatively updating the already-loaded map page, rather than
  // reloading the WebView.
  useEffect(() => {
    if (coordsEqual(lastEmittedRef.current, value)) return;
    lastEmittedRef.current = value;

    if (value) {
      webViewRef.current?.injectJavaScript(`window.setPin && window.setPin(${value.lat}, ${value.lon}); true;`);
    } else {
      webViewRef.current?.injectJavaScript('window.clearPin && window.clearPin(); true;');
    }
  }, [value]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat?: unknown; lon?: unknown };
      if (typeof data.lat === 'number' && typeof data.lon === 'number') {
        const coords = { lat: data.lat, lon: data.lon };
        lastEmittedRef.current = coords;
        onChange(coords);
      }
    } catch {
      // Ignore malformed messages.
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
