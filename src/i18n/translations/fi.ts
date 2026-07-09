/**
 * Canonical translation dictionary. Its shape defines every valid
 * translation key path; other locales are typed against `typeof fi`.
 */
export const fi = {
  app: {
    title: "Golf-sää",
  },
  courses: {
    subtitleLocation:
      "Lähimmät kentät sijaintiisi nähden, päivitetty FMI:stä, YR.no:sta ja Open-Meteosta.",
    subtitleWeather: "Parhaat pelisäät juuri nyt, lähimmät ensin.",
    subtitleCombined:
      "Etäisyyden ja nykyisten olosuhteiden yhdistelmä, lähimmät ensin.",
    locationDenied:
      "Sijaintilupa epäätty — näytetään kenttiä Kuopion lähellä. Voit asettaa oletussijainnin asetuksista.",
    locationLoading:
      "Etsitään sijaintiasi — näytetään toistaiseksi kenttiä Kuopion lähellä.",
    locationSaved: "Näytetään kenttiä tallennetun oletussijaintisi lähellä.",
    openSettings: "Avaa asetukset",
    refreshOrder: "Päivitä järjestys",
  },
  courseDetail: {
    backToCourses: "Takaisin kentille",
    courseNotFound: "Kenttää ei löytynut",
    courseNotFoundBody: "Emme löytäneet kyseistä golfkenttää.",
    away: "päässä",
    nextHours: "Seuraavat tunnit (yhdistetty keskiarvo)",
    noForecastData: "Ennustetietoja ei saatavilla.",
    bySource: "Lähteittäin (seuraavat tunnit)",
    attribution:
      "Säätiedot: FMI (Ilmatieteen laitos), YR.no (MET Norway) ja Open-Meteo.",
  },
  courseCard: {
    loadingForecast: "Ladataan ennustetta…",
    hourlyForecast: "Tuntiennuste",
    hideHourlyForecast: "Piilota tuntiennuste",
    showHourlyForecast: "Näytä tuntiennuste",
  },
  sourceToggle: {
    combined: "Yhdistetty",
    bySource: "Lähteittäin",
  },
  sourceTable: {
    noForecastData: "Ennustetietoja ei saatavilla.",
    unavailable: "Ei saatavilla",
  },
  sunTimes: {
    sunrise: "Aurinkonousu",
    sunset: "Auringonlasku",
    daylight: "Päivänvalo",
    playableLight: "Pelattava valo (siviilihämärä): {dawn} – {dusk}",
  },
  weatherSummary: {
    loadingForecast: "Ladataan ennustetta…",
    windAndPrecipitation: "{wind} tuuli · {precipitation}",
  },
  sort: {
    location: "Sijainti",
    weather: "Paras sää",
    combined: "Yhdistetty",
  },
  startTime: {
    open: "Valitse aloitusaika",
    now: "Nyt",
    title: "Valitse aloitusaika",
    selectDay: "Päivä",
    selectHour: "Tunti",
    today: "Tänään",
    done: "Valmis",
  },
  playability: {
    trend: "{early} nyt, {late} myöhemmin",
    labels: {
      Excellent: "Erinomainen",
      Good: "Hyvä",
      Fair: "Kohtalainen",
      Hot: "Kuuma",
      Poor: "Huono",
      Bad: "Surkea",
      Dark: "Pimeä",
    },
    reasons: {
      badConditions: "runsasta sadetta, kylmää tai voimakasta tuulta",
      poorConditions: "sadetta, kylmää tai tuulista",
      fairConditions: "kevyttä sadetta, viileää tai tuulenvireistä",
      hot: "kuumaa",
      hotSpell: "kuuma jakso odotettavissa",
    },
  },
  format: {
    hourUnit: "h",
    minuteUnit: "min",
  },
  errors: {
    failedToGetLocation: "Sijainnin hakeminen epäonnistui",
    failedToLoadWeather: "Säätietojen lataaminen epäonnistui",
    forecastTimedOut: "Ennustepyyntö aikakatkaistiin",
    failedToLoadForecast: "Ennusteen lataaminen epäonnistui",
  },
  settings: {
    title: "Asetukset",
    language: "Kieli",
    languageDescription: "Valitse sovelluksen käyttökieli.",
    finnish: "Suomi",
    english: "English",
    darkScoring: {
      title: "Pimeän pisteytys",
      description:
        "Kun käytössä, tunnit ilman pelivaloa merkitään Pimeä-luokkaan ja huomioidaan pisteytyksessä.",
      toggle: "Huomioi pimeys",
    },
    location: {
      title: "Oletussijainti",
      description:
        "Sovellus käyttää laitteen sijaintia, kun se on saatavilla. Muussa tapauksessa käytetään tätä tallennettua oletussijaintia. Valitse sijainti napauttamalla karttaa.",
      instruction: "Napauta karttaa valitaksesi sijainnin.",
      savedLabel: "Tallennettu sijainti: {coords}",
      notSet: "Oletussijaintia ei ole asetettu — käytössä on Kuopio.",
      save: "Tallenna sijainti",
      clear: "Poista tallennettu sijainti",
    },
  },
  tabs: {
    courses: "Kentät",
    favorites: "Suosikit",
  },
  favorites: {
    title: "Suosikit",
    empty: "Ei suosikkeja vielä. Lisää kenttiä suosikeiksi tähdellä.",
    addFavorite: "Lisää suosikkeihin",
    removeFavorite: "Poista suosikeista",
  },
  createdBy: {
    credit: "Tehnyt Pekka Heikkinen",
    contact: "Ota yhteyttä",
  },
  usage: {
    title: "Käyttö",
    description:
      "Paikallinen käyttöloki tällä laitteella. Tietoja ei lähetetä minnekään.",
    totalSessions: "Käyntejä",
    distinctUsers: "Eri käyttäjätunnisteita",
    distinctFingerprints: "Eri laitesormenjälkiä",
    firstSeen: "Ensimmäinen käynti",
    lastSeen: "Viimeisin käynti",
    recent: "Viimeisimmät käyntiajat",
    empty: "Ei käyttötietoja vielä.",
    export: "Vie käyttöloki",
    exported: "Kopioitu leikepöydälle",
    shared: "Jaettu",
    reset: "Tyhjennä käyttöloki",
    passwordPrompt: "Sivu on suojattu salasanalla.",
    passwordPlaceholder: "Salasana",
    unlock: "Avaa",
    wrongPassword: "Väärä salasana.",
  },
};

export type TranslationDictionary = typeof fi;
