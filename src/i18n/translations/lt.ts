import type { TranslationDictionary } from './fi';

// Typed against `TranslationDictionary` so a missing or extra key here is a
// compile error, keeping this locale in sync with the canonical `fi` shape.
export const lt: TranslationDictionary = {
  app: {
    title: 'Golfo orai',
  },
  courses: {
    subtitleLocation:
      'Arčiausiai jūsų vietos esantys aikštynai, atnaujinti iš FMI, YR.no ir Open-Meteo.',
    subtitleWeather:
      'Aikštynai su geriausiomis žaidimo sąlygomis dabar, arčiausiai pirmiausia.',
    subtitleCombined:
      'Atstumo ir dabartinių sąlygų derinys, arčiausiai pirmiausia.',
    locationDenied:
      'Vietos leidimas atmestas — rodomi aikštynai netoli Kuopio. Numatytąją vietą galite nustatyti Nustatymuose.',
    locationLoading:
      'Ieškoma jūsų vietos — kol kas rodomi aikštynai netoli Kuopio.',
    locationSaved: 'Rodomi aikštynai netoli jūsų išsaugotos numatytosios vietos.',
    openSettings: 'Atidaryti nustatymus',
    refreshOrder: 'Atnaujinti tvarką',
    locationMoved: 'Vieta pasikeitė — atnaujinti',
    scrollToTop: 'Slinkti į viršų',
    emptyDistance:
      'Nerasta aikštynų per {km} km atstumą. Pabandykite padidinti atstumo ribą.',
    emptySearch: 'Pagal paiešką aikštynų nerasta.',
  },
  courseDetail: {
    backToCourses: 'Atgal į aikštynus',
    courseNotFound: 'Aikštynas nerastas',
    courseNotFoundBody: 'Nepavyko rasti šio golfo aikštyno.',
    away: 'atstumu',
    forecastRange: 'Kitos {count} val.',
    nextHours: 'Artimiausios valandos (bendras vidurkis)',
    noForecastData: 'Prognozės duomenų nėra.',
    bySource: 'Pagal šaltinį (artimiausios valandos)',
    hourlyUnavailable:
      'Valandinė prognozė šiam laikui nepasiekiama — rodoma tik santrauka.',
    attribution:
      'Orų duomenys iš FMI (Ilmatieteen laitos), YR.no (MET Norway) ir Open-Meteo.',
  },
  courseCard: {
    loadingForecast: 'Kraunama prognozė…',
    hourlyForecast: 'Valandinė prognozė',
    hideHourlyForecast: 'Slėpti valandinę prognozę',
    showHourlyForecast: 'Rodyti valandinę prognozę',
    hourlyUnavailable: 'Valandinė prognozė nepasiekiama',
  },
  sourceToggle: {
    combined: 'Bendra',
    bySource: 'Pagal šaltinį',
  },
  courseSearch: {
    placeholder: 'Ieškoti',
    clear: 'Išvalyti paiešką',
  },
  sourceTable: {
    noForecastData: 'Prognozės duomenų nėra.',
    unavailable: 'Nepasiekiama',
  },
  sunTimes: {
    sunrise: 'Saulėtekis',
    sunset: 'Saulėlydis',
    daylight: 'Dienos šviesa',
    playableLight: 'Žaidimui tinkama šviesa (civilinė prieblanda): {dawn} – {dusk}',
  },
  weatherSummary: {
    loadingForecast: 'Kraunama prognozė…',
    windAndPrecipitation: '{wind} vėjas · {precipitation}',
    feelsLike: 'Jaučiama kaip {temp}',
  },
  sort: {
    location: 'Vieta',
    weather: 'Geriausi orai',
    combined: 'Bendra',
  },
  startTime: {
    open: 'Pasirinkti pradžios laiką',
    now: 'Dabar',
    title: 'Pasirinkti pradžios laiką',
    selectDay: 'Diena',
    selectHour: 'Valanda',
    today: 'Šiandien',
    done: 'Atlikta',
  },
  locationButton: {
    open: 'Pasirinkti vietą',
    title: 'Pasirinkti vietą',
    done: 'Atlikta',
    loading: 'Kraunama…',
    myLocation: 'Mano vieta',
  },
  distance: {
    open: 'Pasirinkti atstumo ribą',
    title: 'Atstumo riba',
    description: 'Rodyti aikštynus šiuo atstumu.',
    done: 'Atlikta',
    label: '{km} km',
  },
  playability: {
    trend: '{early} dabar, {late} vėliau',
    labels: {
      Excellent: 'Puikios',
      Good: 'Geros',
      Fair: 'Vidutiniškos',
      Hot: 'Karšta',
      Sweltering: 'Tvanku',
      Poor: 'Prastos',
      Bad: 'Blogos',
      Dark: 'Tamsu',
    },
    reasons: {
      badConditions: 'smarkus lietus, šalta arba stiprus vėjas',
      poorConditions: 'lietus, šalta arba vėjuota',
      fairConditions: 'silpnas lietus, vėsu arba vėjuota',
      hot: 'karšta',
      hotSpell: 'tikimasi karščio bangos',
      sweltering: 'labai karšta ir saulėta',
      swelteringSpell: 'laukiama tvankaus laikotarpio',
    },
  },
  format: {
    hourUnit: 'val.',
    minuteUnit: 'min.',
  },
  errors: {
    failedToGetLocation: 'Nepavyko nustatyti vietos',
    failedToLoadWeather: 'Nepavyko įkelti orų duomenų',
    forecastTimedOut: 'Prognozės užklausa baigėsi laiku',
    failedToLoadForecast: 'Nepavyko įkelti prognozės',
  },
  settings: {
    title: 'Nustatymai',
    language: 'Kalba',
    languageDescription: 'Pasirinkite programos kalbą.',
    finnish: 'Suomi',
    english: 'English',
    swedish: 'Svenska',
    norwegian: 'Norsk',
    estonian: 'Eesti',
    lithuanian: 'Lietuvių',
    latvian: 'Latviešu',
    danish: 'Dansk',
    tabs: {
      user: 'Naudotojas',
      search: 'Paieška',
    },
    theme: {
      title: 'Tema',
      description: 'Pasirinkite programos išvaizdą.',
      system: 'Sistema',
      light: 'Šviesi',
      dark: 'Tamsi',
    },
    darkScoring: {
      title: 'Tamsos vertinimas',
      description:
        'Kai įjungta, valandos be žaidimui tinkamos šviesos pažymimos kaip Tamsu ir įtraukiamos į vertinimą.',
      toggle: 'Atsižvelgti į tamsą',
    },
    location: {
      title: 'Numatytoji vieta',
      description:
        'Programa naudoja įrenginio vietą, kai ji pasiekiama. Kitu atveju naudojama ši išsaugota numatytoji vieta. Vietą pasirinkite bakstelėję žemėlapį.',
      instruction: 'Bakstelėkite žemėlapį, kad pasirinktumėte vietą.',
      savedLabel: 'Išsaugota vieta: {coords}',
      notSet: 'Numatytoji vieta nenustatyta — naudojamas Kuopio.',
      save: 'Išsaugoti vietą',
      clear: 'Ištrinti išsaugotą vietą',
    },
  },
  tabs: {
    courses: 'Aikštynai',
    favorites: 'Mėgstami',
    bookmarks: 'Žymelės',
  },
  favorites: {
    title: 'Mėgstami',
    empty: 'Kol kas nėra mėgstamų. Pridėkite aikštynus prie mėgstamų su žvaigždute.',
    addFavorite: 'Pridėti prie mėgstamų',
    removeFavorite: 'Pašalinti iš mėgstamų',
  },
  bookmarks: {
    title: 'Žymelės',
    empty: 'Kol kas nėra žymelių. Pridėkite aikštyną ir laiką su žymelės ženkleliu.',
    add: 'Pridėti žymelę',
    remove: 'Pašalinti žymelę',
    removeMessage: 'Pašalinti šią žymelę?',
    confirmRemove: 'Pašalinti',
    cancel: 'Atšaukti',
  },
  createdBy: {
    credit: 'Sukūrė Pekka Heikkinen',
    contact: 'Kontaktai',
  },
  usage: {
    title: 'Naudojimas',
    description:
      'Vietinis naudojimo žurnalas tik šiame įrenginyje. Niekas niekur nesiunčiama.',
    totalSessions: 'Paleidimai',
    distinctUsers: 'Unikalūs naudotojų ID',
    distinctFingerprints: 'Unikalūs įrenginių atspaudai',
    firstSeen: 'Pirmas apsilankymas',
    lastSeen: 'Paskutinis apsilankymas',
    recent: 'Naujausi naudojimo laikai',
    empty: 'Naudojimo duomenų kol kas nėra.',
    export: 'Eksportuoti naudojimo žurnalą',
    exported: 'Nukopijuota į iškarpinę',
    shared: 'Bendrinta',
    reset: 'Išvalyti naudojimo žurnalą',
    passwordPrompt: 'Šis puslapis yra apsaugotas slaptažodžiu.',
    passwordPlaceholder: 'Slaptažodis',
    unlock: 'Atrakinti',
    wrongPassword: 'Neteisingas slaptažodis.',
  },
};
