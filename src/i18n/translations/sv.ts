import type { TranslationDictionary } from './fi';

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const sv: TranslationDictionary = {
  app: {
    title: 'Golfväder',
  },
  courses: {
    subtitleLocation:
      'Banor närmast din plats, uppdaterat från FMI, YR.no och Open-Meteo.',
    subtitleWeather:
      'Banor med bäst spelförhållanden just nu, närmast först.',
    subtitleCombined:
      'Balanserar avstånd och aktuella förhållanden, närmast först.',
    locationDenied:
      'Platsbehörighet nekad — visar banor nära Kuopio. Du kan ange en standardplats i inställningarna.',
    locationLoading:
      'Söker din plats — visar banor nära Kuopio tills vidare.',
    locationSaved: 'Visar banor nära din sparade standardplats.',
    openSettings: 'Öppna inställningar',
    refreshOrder: 'Uppdatera ordning',
    locationMoved: 'Platsen har ändrats — uppdatera',
  },
  courseDetail: {
    backToCourses: 'Tillbaka till banor',
    courseNotFound: 'Banan hittades inte',
    courseNotFoundBody: 'Vi kunde inte hitta den golfbanan.',
    away: 'bort',
    nextHours: 'Kommande timmar (kombinerat medelvärde)',
    noForecastData: 'Ingen prognosdata tillgänglig.',
    bySource: 'Per källa (kommande timmar)',
    attribution:
      'Väderdata från FMI (Ilmatieteen laitos), YR.no (MET Norway) och Open-Meteo.',
  },
  courseCard: {
    loadingForecast: 'Laddar prognos…',
    hourlyForecast: 'Timprognos',
    hideHourlyForecast: 'Dölj timprognos',
    showHourlyForecast: 'Visa timprognos',
  },
  sourceToggle: {
    combined: 'Kombinerat',
    bySource: 'Per källa',
  },
  courseSearch: {
    placeholder: 'Sök',
    clear: 'Rensa sökning',
  },
  sourceTable: {
    noForecastData: 'Ingen prognosdata tillgänglig.',
    unavailable: 'Inte tillgänglig',
  },
  sunTimes: {
    sunrise: 'Soluppgång',
    sunset: 'Solnedgång',
    daylight: 'Dagsljus',
    playableLight: 'Spelbart ljus (civil skymning): {dawn} – {dusk}',
  },
  weatherSummary: {
    loadingForecast: 'Laddar prognos…',
    windAndPrecipitation: '{wind} vind · {precipitation}',
  },
  sort: {
    location: 'Plats',
    weather: 'Bäst väder',
    combined: 'Kombinerat',
  },
  startTime: {
    open: 'Välj starttid',
    now: 'Nu',
    title: 'Välj starttid',
    selectDay: 'Dag',
    selectHour: 'Timme',
    today: 'Idag',
    done: 'Klar',
  },
  locationButton: {
    open: 'Välj plats',
    title: 'Välj plats',
    done: 'Klar',
    loading: 'Laddar…',
    myLocation: 'Min plats',
  },
  distance: {
    open: 'Välj avståndsgräns',
    title: 'Avståndsgräns',
    description: 'Visa banor inom detta avstånd.',
    done: 'Klar',
    label: '{km} km',
  },
  playability: {
    trend: '{early} nu, {late} senare',
    labels: {
      Excellent: 'Utmärkt',
      Good: 'Bra',
      Fair: 'Godtagbar',
      Hot: 'Varmt',
      Poor: 'Dåligt',
      Bad: 'Uselt',
      Dark: 'Mörkt',
    },
    reasons: {
      badConditions: 'kraftigt regn, kallt eller stark vind',
      poorConditions: 'regn, kallt eller blåsigt',
      fairConditions: 'lätt regn, svalt eller blåsigt',
      hot: 'varmt',
      hotSpell: 'värmebölja väntas',
    },
  },
  format: {
    hourUnit: 'h',
    minuteUnit: 'min',
  },
  errors: {
    failedToGetLocation: 'Det gick inte att hämta platsen',
    failedToLoadWeather: 'Det gick inte att läsa in väderdata',
    forecastTimedOut: 'Prognosförfrågan tog för lång tid',
    failedToLoadForecast: 'Det gick inte att läsa in prognosen',
  },
  settings: {
    title: 'Inställningar',
    language: 'Språk',
    languageDescription: 'Välj appens språk.',
    finnish: 'Suomi',
    english: 'English',
    swedish: 'Svenska',
    norwegian: 'Norsk',
    estonian: 'Eesti',
    lithuanian: 'Lietuvių',
    latvian: 'Latviešu',
    danish: 'Dansk',
    tabs: {
      user: 'Användare',
      search: 'Sökning',
    },
    theme: {
      title: 'Tema',
      description: 'Välj appens utseende.',
      system: 'System',
      light: 'Ljust',
      dark: 'Mörkt',
    },
    darkScoring: {
      title: 'Mörkerpoäng',
      description:
        'När aktiverat märks timmar utan spelbart ljus som Mörkt och räknas in i poängsättningen.',
      toggle: 'Ta hänsyn till mörker',
    },
    location: {
      title: 'Standardplats',
      description:
        'Appen använder enhetens plats när den är tillgänglig. Annars används denna sparade standardplats istället. Välj en plats genom att trycka på kartan.',
      instruction: 'Tryck på kartan för att välja en plats.',
      savedLabel: 'Sparad plats: {coords}',
      notSet: 'Ingen standardplats angiven — Kuopio används.',
      save: 'Spara plats',
      clear: 'Ta bort sparad plats',
    },
  },
  tabs: {
    courses: 'Banor',
    favorites: 'Favoriter',
  },
  favorites: {
    title: 'Favoriter',
    empty: 'Inga favoriter än. Lägg till banor som favoriter med stjärnan.',
    addFavorite: 'Lägg till som favorit',
    removeFavorite: 'Ta bort från favoriter',
  },
  createdBy: {
    credit: 'Skapad av Pekka Heikkinen',
    contact: 'Kontakt',
  },
  usage: {
    title: 'Användning',
    description:
      'Lokal användningslogg endast på den här enheten. Inget skickas någonstans.',
    totalSessions: 'Starter',
    distinctUsers: 'Unika användar-ID:n',
    distinctFingerprints: 'Unika enhetsfingeravtryck',
    firstSeen: 'Första besöket',
    lastSeen: 'Senaste besöket',
    recent: 'Senaste användningstider',
    empty: 'Inga användardata än.',
    export: 'Exportera användningslogg',
    exported: 'Kopierat till urklipp',
    shared: 'Delat',
    reset: 'Rensa användningslogg',
    passwordPrompt: 'Denna sida är lösenordsskyddad.',
    passwordPlaceholder: 'Lösenord',
    unlock: 'Lås upp',
    wrongPassword: 'Fel lösenord.',
  },
};
