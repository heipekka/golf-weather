import type { TranslationDictionary } from './fi';

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const et: TranslationDictionary = {
  app: {
    title: 'Golfiilm',
  },
  courses: {
    subtitleLocation:
      'Lähimad väljakud teie asukohale, uuendatud FMI, YR.no ja Open-Meteo andmetega.',
    subtitleWeather:
      'Praegu parimate mänguolude väljakud, lähimad esimesena.',
    subtitleCombined:
      'Kaugust ja praeguseid tingimusi tasakaalustav järjestus, lähimad esimesena.',
    locationDenied:
      'Asukohaluba keelatud — kuvatakse Kuopio lähedal olevad väljakud. Vaikeasukoha saab määrata seadetest.',
    locationLoading:
      'Otsime teie asukohta — praegu kuvatakse Kuopio lähedal olevad väljakud.',
    locationSaved: 'Kuvatakse väljakud teie salvestatud vaikeasukoha lähedal.',
    openSettings: 'Ava seaded',
    refreshOrder: 'Värskenda järjestust',
    locationMoved: 'Asukoht muutus — värskenda',
  },
  courseDetail: {
    backToCourses: 'Tagasi väljakute juurde',
    courseNotFound: 'Väljakut ei leitud',
    courseNotFoundBody: 'Me ei leidnud seda golfiväljakut.',
    away: 'kaugusel',
    nextHours: 'Järgmised tunnid (koondkeskmine)',
    noForecastData: 'Prognoosiandmed ei ole saadaval.',
    bySource: 'Allikate kaupa (järgmised tunnid)',
    attribution:
      'Ilmaandmed pärinevad FMI-lt (Ilmatieteen laitos), YR.no-lt (MET Norway) ja Open-Meteolt.',
  },
  courseCard: {
    loadingForecast: 'Prognoosi laadimine…',
    hourlyForecast: 'Tunniprognoos',
    hideHourlyForecast: 'Peida tunniprognoos',
    showHourlyForecast: 'Näita tunniprognoosi',
  },
  sourceToggle: {
    combined: 'Koondatud',
    bySource: 'Allikate kaupa',
  },
  courseSearch: {
    placeholder: 'Otsi',
    clear: 'Tühjenda otsing',
  },
  sourceTable: {
    noForecastData: 'Prognoosiandmed ei ole saadaval.',
    unavailable: 'Ei ole saadaval',
  },
  sunTimes: {
    sunrise: 'Päikesetõus',
    sunset: 'Päikeseloojang',
    daylight: 'Päevavalgus',
    playableLight: 'Mängitav valgus (tsiviilhämarik): {dawn} – {dusk}',
  },
  weatherSummary: {
    loadingForecast: 'Prognoosi laadimine…',
    windAndPrecipitation: '{wind} tuul · {precipitation}',
  },
  sort: {
    location: 'Asukoht',
    weather: 'Parim ilm',
    combined: 'Koondatud',
  },
  startTime: {
    open: 'Vali algusaeg',
    now: 'Praegu',
    title: 'Vali algusaeg',
    selectDay: 'Päev',
    selectHour: 'Tund',
    today: 'Täna',
    done: 'Valmis',
  },
  locationButton: {
    open: 'Vali asukoht',
    title: 'Vali asukoht',
    done: 'Valmis',
    loading: 'Laadimine…',
    myLocation: 'Minu asukoht',
  },
  distance: {
    open: 'Vali kauguse piirang',
    title: 'Kauguse piirang',
    description: 'Näita väljakuid selle kauguse piires.',
    done: 'Valmis',
    label: '{km} km',
  },
  playability: {
    trend: '{early} praegu, {late} hiljem',
    labels: {
      Excellent: 'Suurepärane',
      Good: 'Hea',
      Fair: 'Rahuldav',
      Hot: 'Palav',
      Poor: 'Halb',
      Bad: 'Kehv',
      Dark: 'Pime',
    },
    reasons: {
      badConditions: 'tugev vihm, külm või tugev tuul',
      poorConditions: 'vihm, külm või tuuline',
      fairConditions: 'kerge vihm, jahe või tuuline',
      hot: 'palav',
      hotSpell: 'oodata on palavat perioodi',
    },
  },
  format: {
    hourUnit: 't',
    minuteUnit: 'min',
  },
  errors: {
    failedToGetLocation: 'Asukoha hankimine ebaõnnestus',
    failedToLoadWeather: 'Ilmaandmete laadimine ebaõnnestus',
    forecastTimedOut: 'Prognoosipäring aegus',
    failedToLoadForecast: 'Prognoosi laadimine ebaõnnestus',
  },
  settings: {
    title: 'Seaded',
    language: 'Keel',
    languageDescription: 'Valige rakenduse keel.',
    finnish: 'Suomi',
    english: 'English',
    swedish: 'Svenska',
    norwegian: 'Norsk',
    estonian: 'Eesti',
    lithuanian: 'Lietuvių',
    latvian: 'Latviešu',
    danish: 'Dansk',
    tabs: {
      user: 'Kasutaja',
      search: 'Otsing',
    },
    theme: {
      title: 'Teema',
      description: 'Valige rakenduse välimus.',
      system: 'Süsteem',
      light: 'Hele',
      dark: 'Tume',
    },
    darkScoring: {
      title: 'Pimeduse hindamine',
      description:
        'Kui see on sees, märgistatakse tunnid, mil mängitav valgus puudub, kui Pime ja need arvestatakse hindamisel.',
      toggle: 'Arvesta pimedust',
    },
    location: {
      title: 'Vaikeasukoht',
      description:
        'Rakendus kasutab seadme asukohta, kui see on saadaval. Vastasel juhul kasutatakse selle salvestatud vaikeasukohta. Vali asukoht kaardil koputades.',
      instruction: 'Koputa kaardile asukoha valimiseks.',
      savedLabel: 'Salvestatud asukoht: {coords}',
      notSet: 'Vaikeasukohta ei ole määratud — kasutatakse Kuopiot.',
      save: 'Salvesta asukoht',
      clear: 'Kustuta salvestatud asukoht',
    },
  },
  tabs: {
    courses: 'Väljakud',
    favorites: 'Lemmikud',
  },
  favorites: {
    title: 'Lemmikud',
    empty: 'Lemmikuid veel ei ole. Lisa väljakuid lemmikutesse tähega.',
    addFavorite: 'Lisa lemmikutesse',
    removeFavorite: 'Eemalda lemmikutest',
  },
  createdBy: {
    credit: 'Loonud Pekka Heikkinen',
    contact: 'Kontakt',
  },
  usage: {
    title: 'Kasutus',
    description:
      'Kohalik kasutuslogi ainult sellel seadmel. Midagi ei saadeta kuhugi.',
    totalSessions: 'Käivitused',
    distinctUsers: 'Erinevad kasutaja ID-d',
    distinctFingerprints: 'Erinevad seadme sõrmejäljed',
    firstSeen: 'Esimene külastus',
    lastSeen: 'Viimane külastus',
    recent: 'Viimased kasutusajad',
    empty: 'Kasutusandmeid veel ei ole.',
    export: 'Ekspordi kasutuslogi',
    exported: 'Kopeeritud lõikelauale',
    shared: 'Jagatud',
    reset: 'Tühjenda kasutuslogi',
    passwordPrompt: 'See leht on parooliga kaitstud.',
    passwordPlaceholder: 'Parool',
    unlock: 'Ava',
    wrongPassword: 'Vale parool.',
  },
};
