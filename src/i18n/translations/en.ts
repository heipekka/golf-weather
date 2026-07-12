import type { TranslationDictionary } from "./fi";

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const en: TranslationDictionary = {
  app: {
    title: "Golf Weather",
  },
  courses: {
    subtitleLocation:
      "Courses nearest to your location, updated from FMI, YR.no and Open-Meteo.",
    subtitleWeather:
      "Courses with the best playing conditions right now, nearest first.",
    subtitleCombined:
      "Balancing distance and current conditions, nearest first.",
    locationDenied:
      "Location permission denied — showing courses near Kuopio. You can set a default location in Settings.",
    locationLoading:
      "Finding your location — showing courses near Kuopio for now.",
    locationSaved: "Showing courses near your saved default location.",
    openSettings: "Open settings",
    refreshOrder: "Refresh order",
    locationMoved: "Location changed — refresh",
    scrollToTop: "Scroll to top",
    emptyDistance:
      "No courses found within {km} km. Try increasing the distance range.",
    emptySearch: "No courses match your search.",
  },
  courseDetail: {
    backToCourses: "Back to courses",
    courseNotFound: "Course not found",
    courseNotFoundBody: "We couldn't find that golf course.",
    away: "away",
    forecastRange: "Next {count} hours",
    nextHours: "Combined average",
    noForecastData: "No forecast data available.",
    bySource: "By source",
    hourlyUnavailable:
      "Hourly forecast isn't available for this time — showing the summary only.",
    attribution:
      "Weather data from FMI (Ilmatieteen laitos), YR.no (MET Norway) and Open-Meteo.",
  },
  courseCard: {
    loadingForecast: "Loading forecast…",
    hourlyForecast: "Hourly forecast",
    hideHourlyForecast: "Hide hourly forecast",
    showHourlyForecast: "Show hourly forecast",
    hourlyUnavailable: "No hourly forecast",
  },
  sourceToggle: {
    combined: "Combined",
    bySource: "By source",
  },
  courseSearch: {
    placeholder: "Search",
    clear: "Clear search",
  },
  sourceTable: {
    noForecastData: "No forecast data available.",
    unavailable: "Unavailable",
  },
  sunTimes: {
    sunrise: "Sunrise",
    sunset: "Sunset",
    daylight: "Daylight",
    playableLight: "Playable light (civil twilight): {dawn} – {dusk}",
  },
  weatherSummary: {
    loadingForecast: "Loading forecast…",
    windAndPrecipitation: "{wind} wind · {precipitation}",
    feelsLike: "Feels like {temp}",
  },
  sort: {
    location: "Location",
    weather: "Best weather",
    combined: "Combined",
  },
  startTime: {
    open: "Choose start time",
    now: "Now",
    title: "Choose start time",
    selectDay: "Day",
    selectHour: "Hour",
    today: "Today",
    done: "Done",
  },
  locationButton: {
    open: "Choose location",
    title: "Choose location",
    done: "Done",
    loading: "Loading…",
    myLocation: "My location",
  },
  distance: {
    open: "Choose distance range",
    title: "Distance range",
    description: "Show courses within this distance.",
    done: "Done",
    label: "{km} km",
  },
  playability: {
    trend: "{early} now, {late} later",
    labels: {
      Excellent: "Excellent",
      Good: "Good",
      Fair: "Fair",
      Hot: "Hot",
      Sweltering: "Sweltering",
      Poor: "Poor",
      Bad: "Bad",
      Dark: "Dark",
    },
    reasons: {
      badConditions: "heavy rain, cold, or strong wind",
      poorConditions: "rain, cold, or windy",
      fairConditions: "light rain, cool, or breezy",
      hot: "hot",
      hotSpell: "hot spell expected",
      sweltering: "very hot and sunny",
      swelteringSpell: "sweltering spell expected",
    },
  },
  format: {
    hourUnit: "h",
    minuteUnit: "min",
  },
  errors: {
    failedToGetLocation: "Failed to get location",
    failedToLoadWeather: "Failed to load weather",
    forecastTimedOut: "Forecast request timed out",
    failedToLoadForecast: "Failed to load forecast",
  },
  settings: {
    title: "Settings",
    language: "Language",
    languageDescription: "Choose the app language.",
    finnish: "Suomi",
    english: "English",
    swedish: "Svenska",
    norwegian: "Norsk",
    estonian: "Eesti",
    lithuanian: "Lietuvių",
    latvian: "Latviešu",
    danish: "Dansk",
    tabs: {
      user: "User",
      search: "Search",
    },
    theme: {
      title: "Theme",
      description: "Choose the app's appearance.",
      system: "System",
      light: "Light",
      dark: "Dark",
    },
    darkScoring: {
      title: "Dark scoring",
      description:
        "When on, hours with no playable light are labeled Dark and factored into playability.",
      toggle: "Account for darkness",
    },
    location: {
      title: "Default location",
      description:
        "The app uses your device location when it is available. Otherwise, this saved default location is used instead. Pick a location by tapping the map.",
      instruction: "Tap the map to choose a location.",
      savedLabel: "Saved location: {coords}",
      notSet: "No default location set — Kuopio is used.",
      save: "Save location",
      clear: "Clear saved location",
    },
  },
  tabs: {
    courses: "Courses",
    favorites: "Favorites",
  },
  favorites: {
    title: "Favorites",
    empty: "No favorites yet. Add courses to your favorites with the star.",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
  },
  createdBy: {
    credit: "Created by Pekka Heikkinen",
    contact: "Contact",
  },
  usage: {
    title: "Usage",
    description:
      "Local usage log on this device only. Nothing is sent anywhere.",
    totalSessions: "Launches",
    distinctUsers: "Distinct user ids",
    distinctFingerprints: "Distinct device fingerprints",
    firstSeen: "First seen",
    lastSeen: "Last seen",
    recent: "Recent usage times",
    empty: "No usage data yet.",
    export: "Export usage log",
    exported: "Copied to clipboard",
    shared: "Shared",
    reset: "Clear usage log",
    passwordPrompt: "This page is password protected.",
    passwordPlaceholder: "Password",
    unlock: "Unlock",
    wrongPassword: "Wrong password.",
  },
};
