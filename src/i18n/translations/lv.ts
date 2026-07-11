import type { TranslationDictionary } from './fi';

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const lv: TranslationDictionary = {
  app: {
    title: 'Golfa laiks',
  },
  courses: {
    subtitleLocation:
      'Tuvākie laukumi jūsu atrašanās vietai, atjaunināti no FMI, YR.no un Open-Meteo.',
    subtitleWeather:
      'Laukumi ar labākajiem spēles apstākļiem tieši tagad, tuvākie vispirms.',
    subtitleCombined:
      'Attāluma un pašreizējo apstākļu kombinācija, tuvākie vispirms.',
    locationDenied:
      'Atrašanās vietas atļauja liegta — tiek rādīti laukumi netālu no Kuopio. Noklusējuma atrašanās vietu var iestatīt sadaļā Iestatījumi.',
    locationLoading:
      'Meklējam jūsu atrašanās vietu — pagaidām tiek rādīti laukumi netālu no Kuopio.',
    locationSaved: 'Tiek rādīti laukumi netālu no jūsu saglabātās noklusējuma atrašanās vietas.',
    openSettings: 'Atvērt iestatījumus',
    refreshOrder: 'Atjaunināt kārtību',
    locationMoved: 'Atrašanās vieta ir mainījusies — atjaunināt',
    scrollToTop: 'Ritināt uz sākumu',
    emptyDistance:
      'Netika atrasts neviens laukums {km} km attālumā. Pamēģiniet palielināt attāluma ierobežojumu.',
    emptySearch: 'Meklēšanai neatbilst neviens laukums.',
  },
  courseDetail: {
    backToCourses: 'Atpakaļ uz laukumiem',
    courseNotFound: 'Laukums netika atrasts',
    courseNotFoundBody: 'Mēs neatradām šo golfa laukumu.',
    away: 'attālumā',
    nextHours: 'Nākamās stundas (kombinētais vidējais)',
    noForecastData: 'Prognozes dati nav pieejami.',
    bySource: 'Pēc avota (nākamās stundas)',
    attribution:
      'Laika apstākļu dati no FMI (Ilmatieteen laitos), YR.no (MET Norway) un Open-Meteo.',
  },
  courseCard: {
    loadingForecast: 'Ielādē prognozi…',
    hourlyForecast: 'Stundu prognoze',
    hideHourlyForecast: 'Paslēpt stundu prognozi',
    showHourlyForecast: 'Rādīt stundu prognozi',
  },
  sourceToggle: {
    combined: 'Kombinēts',
    bySource: 'Pēc avota',
  },
  courseSearch: {
    placeholder: 'Meklēt',
    clear: 'Notīrīt meklēšanu',
  },
  sourceTable: {
    noForecastData: 'Prognozes dati nav pieejami.',
    unavailable: 'Nav pieejams',
  },
  sunTimes: {
    sunrise: 'Saullēkts',
    sunset: 'Saulriets',
    daylight: 'Dienasgaisma',
    playableLight: 'Spēlei piemērota gaisma (civilā krēsla): {dawn} – {dusk}',
  },
  weatherSummary: {
    loadingForecast: 'Ielādē prognozi…',
    windAndPrecipitation: '{wind} vējš · {precipitation}',
  },
  sort: {
    location: 'Atrašanās vieta',
    weather: 'Labākie laika apstākļi',
    combined: 'Kombinēts',
  },
  startTime: {
    open: 'Izvēlēties sākuma laiku',
    now: 'Tagad',
    title: 'Izvēlēties sākuma laiku',
    selectDay: 'Diena',
    selectHour: 'Stunda',
    today: 'Šodien',
    done: 'Gatavs',
  },
  locationButton: {
    open: 'Izvēlēties atrašanās vietu',
    title: 'Izvēlēties atrašanās vietu',
    done: 'Gatavs',
    loading: 'Ielādē…',
    myLocation: 'Mana atrašanās vieta',
  },
  distance: {
    open: 'Izvēlēties attāluma ierobežojumu',
    title: 'Attāluma ierobežojums',
    description: 'Rādīt laukumus šajā attālumā.',
    done: 'Gatavs',
    label: '{km} km',
  },
  playability: {
    trend: '{early} tagad, {late} vēlāk',
    labels: {
      Excellent: 'Izcili',
      Good: 'Labi',
      Fair: 'Vidēji',
      Hot: 'Karsti',
      Poor: 'Slikti',
      Bad: 'Ļoti slikti',
      Dark: 'Tumsa',
    },
    reasons: {
      badConditions: 'spēcīgs lietus, aukstums vai stiprs vējš',
      poorConditions: 'lietus, aukstums vai vējains',
      fairConditions: 'vieglas lietusgāzes, vēss vai vējains',
      hot: 'karsti',
      hotSpell: 'gaidāms karstuma periods',
    },
  },
  format: {
    hourUnit: 'h',
    minuteUnit: 'min',
  },
  errors: {
    failedToGetLocation: 'Neizdevās noteikt atrašanās vietu',
    failedToLoadWeather: 'Neizdevās ielādēt laika apstākļu datus',
    forecastTimedOut: 'Prognozes pieprasījumam iestājās noildze',
    failedToLoadForecast: 'Neizdevās ielādēt prognozi',
  },
  settings: {
    title: 'Iestatījumi',
    language: 'Valoda',
    languageDescription: 'Izvēlieties lietotnes valodu.',
    finnish: 'Suomi',
    english: 'English',
    swedish: 'Svenska',
    norwegian: 'Norsk',
    estonian: 'Eesti',
    lithuanian: 'Lietuvių',
    latvian: 'Latviešu',
    danish: 'Dansk',
    tabs: {
      user: 'Lietotājs',
      search: 'Meklēšana',
    },
    theme: {
      title: 'Tēma',
      description: 'Izvēlieties lietotnes izskatu.',
      system: 'Sistēma',
      light: 'Gaišs',
      dark: 'Tumšs',
    },
    darkScoring: {
      title: 'Tumsas vērtējums',
      description:
        'Kad ieslēgts, stundas bez spēlei piemērotas gaismas tiek apzīmētas kā Tumsa un tiek iekļautas vērtējumā.',
      toggle: 'Ņemt vērā tumsu',
    },
    location: {
      title: 'Noklusējuma atrašanās vieta',
      description:
        'Lietotne izmanto ierīces atrašanās vietu, kad tā ir pieejama. Citādi tiek izmantota šī saglabātā noklusējuma atrašanās vieta. Izvēlieties atrašanās vietu, pieskaroties kartei.',
      instruction: 'Pieskarieties kartei, lai izvēlētos atrašanās vietu.',
      savedLabel: 'Saglabātā atrašanās vieta: {coords}',
      notSet: 'Noklusējuma atrašanās vieta nav iestatīta — tiek izmantots Kuopio.',
      save: 'Saglabāt atrašanās vietu',
      clear: 'Dzēst saglabāto atrašanās vietu',
    },
  },
  tabs: {
    courses: 'Laukumi',
    favorites: 'Izlase',
  },
  favorites: {
    title: 'Izlase',
    empty: 'Izlasē vēl nav laukumu. Pievienojiet laukumus izlasei ar zvaigznīti.',
    addFavorite: 'Pievienot izlasei',
    removeFavorite: 'Noņemt no izlases',
  },
  createdBy: {
    credit: 'Izveidojis Pekka Heikkinen',
    contact: 'Kontakti',
  },
  usage: {
    title: 'Lietojums',
    description:
      'Lokāls lietojuma žurnāls tikai šajā ierīcē. Nekas netiek nosūtīts nekur.',
    totalSessions: 'Palaišanas',
    distinctUsers: 'Unikāli lietotāju ID',
    distinctFingerprints: 'Unikāli ierīču nospiedumi',
    firstSeen: 'Pirmā apmeklējuma reize',
    lastSeen: 'Pēdējā apmeklējuma reize',
    recent: 'Nesenie lietojuma laiki',
    empty: 'Lietojuma datu vēl nav.',
    export: 'Eksportēt lietojuma žurnālu',
    exported: 'Nokopēts starpliktuvē',
    shared: 'Kopīgots',
    reset: 'Notīrīt lietojuma žurnālu',
    passwordPrompt: 'Šī lapa ir aizsargāta ar paroli.',
    passwordPlaceholder: 'Parole',
    unlock: 'Atslēgt',
    wrongPassword: 'Nepareiza parole.',
  },
};
