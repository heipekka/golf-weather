import type { TranslationDictionary } from './fi';

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const en: TranslationDictionary = {
  app: {
    title: 'Golf Weather',
  },
  courses: {
    subtitleLocation: 'Courses nearest to your location, updated from FMI, YR.no and Open-Meteo.',
    subtitleWeather: 'Courses with the best playing conditions right now, nearest first.',
    subtitleCombined: 'Balancing distance and current conditions, nearest first.',
    locationDenied: 'Location permission denied — showing courses near Kuopio. You can set a default location in Settings.',
    locationLoading: 'Finding your location — showing courses near Kuopio for now.',
    locationSaved: 'Showing courses near your saved default location.',
    openSettings: 'Open settings',
    refreshOrder: 'Refresh order',
  },
  courseDetail: {
    backToCourses: 'Back to courses',
    courseNotFound: 'Course not found',
    courseNotFoundBody: "We couldn't find that golf course.",
    away: 'away',
    nextHours: 'Next hours (combined average)',
    noForecastData: 'No forecast data available.',
    bySource: 'By source (next hours)',
    attribution: 'Weather data from FMI (Ilmatieteen laitos), YR.no (MET Norway) and Open-Meteo.',
  },
  courseCard: {
    loadingForecast: 'Loading forecast…',
    hourlyForecast: 'Hourly forecast',
    hideHourlyForecast: 'Hide hourly forecast',
    showHourlyForecast: 'Show hourly forecast',
  },
  sourceToggle: {
    combined: 'Combined',
    bySource: 'By source',
  },
  sourceTable: {
    noForecastData: 'No forecast data available.',
    unavailable: 'Unavailable',
  },
  sunTimes: {
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    daylight: 'Daylight',
    playableLight: 'Playable light (civil twilight): {dawn} – {dusk}',
  },
  weatherSummary: {
    loadingForecast: 'Loading forecast…',
    windAndPrecipitation: '{wind} wind · {precipitation}',
  },
  sort: {
    location: 'Location',
    weather: 'Best weather',
    combined: 'Combined',
  },
  playability: {
    trend: '{early} now, {late} later',
    labels: {
      Excellent: 'Excellent',
      Good: 'Good',
      Fair: 'Fair',
      Hot: 'Hot',
      Poor: 'Poor',
      Bad: 'Bad',
    },
    reasons: {
      badConditions: 'heavy rain, cold, or strong wind',
      poorConditions: 'rain, cold, or windy',
      fairConditions: 'light rain, cool, or breezy',
      hot: 'hot',
      hotSpell: 'hot spell expected',
    },
  },
  format: {
    hourUnit: 'h',
    minuteUnit: 'min',
  },
  errors: {
    failedToGetLocation: 'Failed to get location',
    failedToLoadWeather: 'Failed to load weather',
    forecastTimedOut: 'Forecast request timed out',
    failedToLoadForecast: 'Failed to load forecast',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    languageDescription: 'Choose the app language.',
    finnish: 'Suomi',
    english: 'English',
    location: {
      title: 'Default location',
      description:
        'The app uses your device location when it is available. Otherwise, this saved default location is used instead. Pick a location by tapping the map.',
      instruction: 'Tap the map to choose a location.',
      savedLabel: 'Saved location: {coords}',
      notSet: 'No default location set — Kuopio is used.',
      save: 'Save location',
      clear: 'Clear saved location',
    },
  },
  tabs: {
    courses: 'Courses',
    favorites: 'Favorites',
  },
  favorites: {
    title: 'Favorites',
    empty: 'No favorites yet. Add courses to your favorites with the star.',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
  },
  createdBy: {
    credit: 'Created by Pekka Heikkinen',
    contact: 'Contact',
  },
  usage: {
    title: 'Usage',
    description: "Local usage log on this device only. Nothing is sent anywhere.",
    totalSessions: 'Launches',
    distinctUsers: 'Distinct user ids',
    distinctFingerprints: 'Distinct device fingerprints',
    firstSeen: 'First seen',
    lastSeen: 'Last seen',
    recent: 'Recent usage times',
    empty: 'No usage data yet.',
    export: 'Export usage log',
    exported: 'Copied to clipboard',
    shared: 'Shared',
    reset: 'Clear usage log',
    passwordPrompt: 'This page is password protected.',
    passwordPlaceholder: 'Password',
    unlock: 'Unlock',
    wrongPassword: 'Wrong password.',
  },
};
