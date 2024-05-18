const DEFAULT_LOCALE = "english"; // Interface language (called locale for disambiguation)
const DEFAULT_PHRASE_ID = "good morning";
const INFOBAR_LANGUAGES = ["tagalog", "cebuano", "english"];
// major regional languages
const REGIONAL_LANUAGES = [
  // according to DepEd
  "aklanon",
  "bikol",
  "cebuano",
  "chavacano",
  "hiligaynon",
  "ibanag",
  "ilokano",
  "ivatan",
  "kapampangan",
  "kinaray-a",
  "maguindanao",
  "meranaw",
  "pangasinense",
  "sambal",
  "surigaonon",
  "tagalog",
  "bahasa sug",
  "waray",
  "yakan",
  "cuyonon", // not included in DepEd list, but is one of Palawan's regional language
];
const PIN_LANGUAGE_BLACKLIST = ["english"];
const PINS_ADDED_PER_UPDATE = 4;
const PIN_UPDATE_INTERVAL = 200;
const PIN_MAX_COUNT = 100;
const AUTO_PIN_INTERVAL = 4000;
const AUTO_PIN_TIME = 2200;
// initial cycle starts with the top 8 (in population)
const AUTO_PIN_INITIAL_SEQUENCE = [
  "tagalog",
  "cebuano",
  "ilocano",
  "hiligaynon",
  "waray",
  "bikol",
  "pangasinense",
  "kapampangan",
];

const HISTORY_STATE_TOP = "top";
const HISTORY_STATE_INFOBAR = "infobar";

const STORAGE_KEY_STATE = "state";

// ======================== APP STATE =============================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

const DUMMY_MESSAGES = new Proxy({}, { get: () => () => "" });

/**
 * @typedef {[language: string] : string} Phrases
 * @typedef {[id: string]: Phrases} DataPhrases
 * @typedef { proportions: { [code: string]: { [language: string]: number }} } DataLanguages
 * @typedef {{ phrases: DataPhrases, languages: DataLanguages, topo: Object }} Data
 */

let state = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  mapWidth: 0,
  mapHeight: 0,

  introTextDismissed: false,
  introMode: true,

  /** @type {'tagalog'|'english'} */
  locale: DEFAULT_LOCALE,
  messages: DUMMY_MESSAGES,

  phrasesQuery: "",
  phrasesInputOptions: [],

  mapPaths: [],

  // camera is in screen space
  // camera state is managed by d3.zoom. Don't modify directly.
  // camera applies translate first then zoom on the map
  camera: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  minZoom: 1,
  maxZoom: 1,
  overviewModeZoomThreshold: 2,

  // selections
  /** @type {Phrases|null} */
  currentPhraseID: DEFAULT_PHRASE_ID,
  currentLanguage: null,
  currentAreaCode: null,
  currentPin: null,

  // pins are in geo space
  pins: [],
  pinAdditionInhibitUntil: 0,
  pinHoverInhibitUntil: 0,
  autoPinInhibitUntil: 0,
  autoPinLanguages: [...AUTO_PIN_INITIAL_SEQUENCE],

  labels: [],

  infobar: emptyInfoBar(),

  // data.json
  /** @type {Data|null} */
  data: null,

  get currentPhrases() {
    return this.data && this.currentPhraseID
      ? this.data.phrases[this.currentPhraseID]
      : null;
  },

  get sortedPhrasesInputOptions() {
    const phrasesQuery = this.phrasesQuery;
    return Object.values(this.phrasesInputOptions)
      .map((phrase) => {
        let sort = 0 / 200; // TODO
        if (phrase.text.includes(phrasesQuery)) {
          sort += 2;
        } else {
          const nonconsonants = /[^bcdefghjklmnpqrstvxz]/g;
          const inputConsonants = this.phrasesQuery.replace(nonconsonants, "");
          if (
            phrase.text.replace(nonconsonants, "").includes(inputConsonants)
          ) {
            sort += 1;
          }
        }
        return { ...phrase, sort };
      })
      .sort((a, b) => b.sort - a.sort);
  },

  get normalizedZoomLevel() {
    const zoom = Math.max(1, this.camera.zoom);
    return (Math.log(zoom) / Math.log(this.maxZoom)) ** 2;
  },

  get overviewMode() {
    return state.camera.zoom < state.overviewModeZoomThreshold;
  },

  get detailMode() {
    return state.camera.zoom >= state.maxZoom * 0.6;
  },

  get geo() {
    return (
      this.data &&
      topojson.feature(this.data.topo, this.data.topo.objects.areas)
    );
  },

  get phrases() {
    return this.data ? this.data.phrases : [];
  },

  get visibleViewportWidth() {
    if (state.infobar.active && state.infobar.orientation === "side") {
      const size = parseInt(getCSSVariable("--infobar-side-width"));
      return state.windowWidth - size;
    } else {
      return state.windowWidth;
    }
  },
  get visibleViewportHeight() {
    if (state.infobar.active && state.infobar.orientation === "bottom") {
      const size = parseInt(getCSSVariable("--infobar-bottom-height"));
      return state.windowHeight - size;
    } else {
      return state.windowHeight;
    }
  },
  get visibleViewportOffsetX() {
    return (state.windowWidth - state.visibleViewportWidth) / 2;
  },
  get visibleViewportOffsetY() {
    return (state.windowHeight - state.visibleViewportHeight) / 2;
  },

  get storeableState() {
    return {
      introTextDismissed: this.introTextDismissed,
      locale: this.locale,
    };
  },
};

state = mobx.observable(state, {
  data: mobx.observable.ref,
  messages: mobx.observable.ref,
  mapPaths: mobx.observable.ref,
});

// ======================== UI CONTEXT ============================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

const ui = {
  zoomD3: d3
    .zoom()
    .clickDistance(30)
    .extent(() => [
      [0, 0],
      [window.innerWidth, window.innerHeight],
    ])
    .on("zoom", onZoom),
  hasHover: window.matchMedia("(any-hover: hover)").matches,
  canPinchZoom: false,
};

const dom = {
  preloader: document.getElementById("preloader"),
  logo: document.getElementById("logo"),
  introText: document.getElementById("intro-text"),
  introTextDismissButton: document.getElementById("intro-text-dismiss-button"),
  languageButtons: document.querySelectorAll(".language-button"),
  mapbox: document.getElementById("mapbox"),
  map: document.getElementById("map"),
  overlay: document.getElementById("overlay"),
  pinTemplate: document.getElementById("pin-template"),
  labelTemplate: document.getElementById("label-template"),
  zoomInButton: document.getElementById("zoom-in-button"),
  zoomOutButton: document.getElementById("zoom-out-button"),
  phrasesBox: document.getElementById("phrases-box"),
  phrasesInput: document.getElementById("phrases-input"),
  phrasesOptions: document.getElementById("phrases-options"),
  phrasesItemTemplate: document.getElementById("phrases-item-template"),
  infobar: document.getElementById("infobar"),
  infobarCloseButton: document.getElementById("infobar-close-button"),
  infobarContainer: document.getElementById("infobar-container"),
  infobarHeaderTitle: document.getElementById("infobar-header-title"),
  infobarHeaderSubtitle: document.getElementById("infobar-header-subtitle"),
  infobarBaybayinSection: document.getElementById("infobar-baybayin-section"),
  infobarBaybayin: document.getElementById("infobar-baybayin"),
  infobarTranslationSection: document.getElementById(
    "infobar-translation-section"
  ),
  infobarTranslationList: document.getElementById("infobar-translation-list"),
  infobarTranslationItemTemplate: document.getElementById(
    "infobar-translation-item-template"
  ),
  infobarAreaSection: document.getElementById("infobar-area-section"),
  infobarAreaTitle: document.getElementById("infobar-area-title"),
  infobarAreaDescription: document.getElementById("infobar-area-description"),
  infobarAreaDescriptionExpandButton: document.getElementById(
    "infobar-area-description-expand-button"
  ),
  infobarLanguageSection: document.getElementById("infobar-language-section"),
  infobarLanguageTitle: document.getElementById("infobar-language-title"),
  infobarLanguageVitality: document.getElementById("infobar-language-vitality"),
  vitalityList: document.getElementById("vitality-list"),
  vitalityDescription: document.getElementById("vitality-description"),
  infobarLanguageCode: document.getElementById("infobar-language-code"),
  infobarLanguageCodeValue: document.getElementById(
    "infobar-language-code-value"
  ),
  infobarLanguageDescription: document.getElementById(
    "infobar-language-description"
  ),
  infobarLanguageDescriptionExpandButton: document.getElementById(
    "infobar-language-description-expand-button"
  ),
  infobarLocalsSection: document.getElementById("infobar-locals-section"),
  infobarLocalsTitle: document.getElementById("infobar-locals-title"),
  infobarLocalsDescription: document.getElementById(
    "infobar-locals-description"
  ),
  infobarLocalsChart: document.getElementById("infobar-locals-chart"),
  infobarLocalsChartItemTemplate: document.getElementById(
    "infobar-locals-chart-item-template"
  ),
  infobarMediaSection: document.getElementById("infobar-media-section"),
  infobarMediaList: document.getElementById("infobar-media-list"),
  infobarMediaItemTemplate: document.getElementById(
    "infobar-media-item-template"
  ),
  infobarSourceList: document.getElementById("infobar-source-list"),
};
dom.mapboxD3 = d3.select(dom.mapbox);
dom.svgD3 = d3.select(dom.map).append("svg");
dom.overlayD3 = d3.select(dom.overlay);
dom.phrasesOptionsD3 = d3.select(dom.phrasesOptions);
dom.infobarTranslationListD3 = d3.select(dom.infobarTranslationList);
dom.infobarAreaDescriptionD3 = d3.select(dom.infobarAreaDescription);
dom.infobarLocalsChartD3 = d3.select(dom.infobarLocalsChart);
dom.infobarMediaListD3 = d3.select(dom.infobarMediaList);
dom.infobarSourceListD3 = d3.select(dom.infobarSourceList);

// sanity check
Object.entries(dom).forEach(([key, value]) => {
  if (!value) console.error(`DOM variable not found: ${key}`);
});

const geo = {
  projection: d3.geoEquirectangular().scale(1).translate([0, 0]),
};

// ======================== REACTIVE CODE =========================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

setTimeout(() => {
  initData();
  initInterface();
}, 0);

mobx.autorun(() => storeState(), {
  delay: 6000,
});

mobx.reaction(
  () => state.infobar.active,
  () => onInfobarChangeActiveState()
);

mobx.reaction(
  () => state.locale,
  () => loadMessages(state.locale)
);

mobx.reaction(
  () => state.messages,
  () => renderMessages()
);

mobx.reaction(
  () => state.camera.zoom,
  () => updateZoomButtons()
);

mobx.reaction(
  () => state.sortedPhrasesInputOptions,
  () => renderPhrasesInputOptions()
);

mobx.reaction(
  () => state.windowWidth,
  () => {
    if (state.windowWidth < 800) {
      state.infobar.orientation = "bottom";
    } else {
      state.infobar.orientation = "side";
    }
  },
  { delay: 100, fireImmediately: true }
);

mobx.reaction(
  () => Object.values(state.camera),
  () => updateViewport()
);

mobx.reaction(
  () => [state.windowWidth, state.windowHeight, state.geo],
  () => setupMap(),
  { delay: 100 }
);

mobx.reaction(
  () => [
    state.mapWidth,
    state.mapHeight,
    state.mapPaths,
    state.currentAreaCode,
    state.currentPin,
  ],
  () => renderMap()
);

mobx.reaction(
  () => [Object.values(state.camera), state.currentPhrases],
  () => updatePins(),
  { delay: 300 }
);

mobx.reaction(
  () => [Object.values(state.camera), state.currentPin, deepRead(state.pins)],
  () => renderPins()
);

mobx.reaction(
  () => [state.introMode, state.overviewMode, ...state.pins],
  () => updateLabels(),
  { delay: 300 }
);

mobx.reaction(
  () => [Object.values(state.camera), deepRead(state.labels)],
  () => renderLabels()
);

mobx.reaction(
  () => state.phraseID,
  () => onPhraseChange()
);

mobx.reaction(
  () => [Object.values(state.infobar), state.messages],
  () => renderInfobarGeneral()
);

mobx.reaction(
  () => Object.values(state.infobar.translationItems),
  () => renderInfobarTranslationList()
);

mobx.reaction(
  () => Object.values(state.infobar.areaInfo),
  () => renderInfobarAreaSection()
);

mobx.reaction(
  () => [Object.values(state.infobar.languageInfo), state.messages],
  () => renderInfobarLanguageSection()
);

mobx.reaction(
  () => [Object.values(state.infobar.localsInfo), state.messages],
  () => renderInfobarLocalsSection()
);

mobx.reaction(
  () => [state.infobar.active, Object.values(state.infobar.mediaItems)],
  () => renderInfobarMediaList()
);

function onInfobarChangeActiveState() {
  if (state.infobar.active) {
    if (history.state !== HISTORY_STATE_INFOBAR) {
      history.pushState(HISTORY_STATE_INFOBAR, "");
    }
  } else {
    if (history.state === HISTORY_STATE_INFOBAR) {
      history.back();
    }
  }
}

function onPopState(event) {
  if (history.state === HISTORY_STATE_INFOBAR) {
    history.back();
  }
  if (state.infobar.active) {
    deselectAll();
  }
}

function onInteract() {
  dismissIntroText();
  inhibitAutoPin(2000);

  if (state.introMode) {
    state.introMode = false;
  }
}

function onZoom() {
  const event = d3.event;
  mobx.runInAction(() => {
    let { x, y, k } = event.transform;
    state.camera.x = x;
    state.camera.y = y;
    state.camera.zoom = k;

    if (event.sourceEvent instanceof MouseEvent) {
      onInteract();
    }
    inhibitPinHover(500);
  });
}

// hack for trackpad zooming and panning
const onMapboxWheel = mobx.action((event) => {
  if (event.deltaMode === /* DOM_DELTA_PIXEL */ 0) {
    if (event.ctrlKey && event.deltaY) {
      // ctrlKey + scroll Y mean a pinch gesture
      // user is upgrade to a pan+zoom interface
      ui.canPinchZoom = true;
    }
    if (ui.canPinchZoom) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.ctrlKey) {
        const box = dom.mapbox.getBoundingClientRect();
        dom.mapboxD3.call(ui.zoomD3.scaleBy, 1.01 ** -event.deltaY, [
          event.clientX - box.x,
          event.clientY - box.y,
        ]);
      } else {
        dom.mapboxD3.call(
          ui.zoomD3.translateBy,
          -event.deltaX / state.camera.zoom,
          -event.deltaY / state.camera.zoom
        );
      }

      inhibitAutoPin(1000);
    }
  }
});

function onResize() {
  mobx.runInAction(() => {
    state.windowWidth = window.innerWidth;
    state.windowHeight = window.innerHeight;
  });
}

function onOverlayMouseDown(event) {
  // prevent panning when clicking on a bubble
  if (event.target.closest(".bubble")) {
    event.stopPropagation();
  }
}

function onMapClick() {
  onInteract();
  deselectAll();
}

const onPinClick = mobx.action((pin) => {
  onInteract();

  if (state.overviewMode && !pin.active) {
    zoomToPin(pin, state.overviewModeZoomThreshold * 2, deselectAll);
  } else {
    selectPin(pin);
    deactivatePins();
    pin.active = true;
  }
});

const onPathClick = mobx.action((path) => {
  onInteract();
  d3.event.stopPropagation();
  deactivatePins();

  if (state.currentPin) {
    deselectAll();
  } else {
    const feature = findFeature(state.geo, path.areaCode);
    if (state.overviewMode) {
      zoomToFeature(feature, state.overviewModeZoomThreshold, deselectAll);
    } else {
      selectArea(feature);
    }
  }
});

const onInfobarCloseClick = mobx.action(() => {
  deselectAll();
});

const dismissIntroText = mobx.action((force = false) => {
  if (force || state.introTextDismissed) {
    state.introTextDismissed = true;
    dom.introText.classList.add("intro-text-dismissed");
  }
});

const onPhrasesInputFocus = mobx.action(() => {
  deselectAll();
  state.phrasesInputOptions = Object.entries(state.phrases)
    .map(([id, phrases]) => ({ id, text: phrases[state.locale] }))
    .filter((phrase) => phrase.text !== dom.phrasesInput.value);
  dom.phrasesInput.select();
});

function onPhrasesBoxUnfocus() {
  setTimeout(() => {
    if (!dom.phrasesBox.contains(document.activeElement)) {
      mobx.runInAction(() => (state.phrasesInputOptions = []));
    }
  }, 0);
}

const onPhrasesInput = mobx.action(() => {
  const input = dom.phrasesInput.value
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  state.phrasesQuery = input;

  const matchingEntry = Object.entries(state.phrases).find(
    ([id, phrases]) => phrases[state.locale] === input
  );

  if (matchingEntry) {
    state.currentPhraseID = matchingEntry[0];
  }
});

function onPhrasesBoxClick(event) {
  const item = event.target.closest(".phrases-item");
  if (item) {
    dom.phrasesInput.value = state.phrases[item.dataset.id][state.locale];
    onPhrasesInput();
    state.autoPinLanguages = [...AUTO_PIN_INITIAL_SEQUENCE];

    dom.phrasesInput.blur();
    mobx.runInAction(() => (state.phrasesInputOptions = []));
  }
}

const onPhraseChange = mobx.action(() => {
  state.pins = [];
  state.labels = [];
  zoomOut();
});

// ======================== INITIALIZATION ========================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function initInterface() {
  window.addEventListener("resize", onResize);

  if (history.state === HISTORY_STATE_INFOBAR) {
    history.back();
  }
  history.replaceState(HISTORY_STATE_TOP, "");
  window.addEventListener("popstate", onPopState);

  for (const button of dom.languageButtons) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      state.locale = button.dataset.language;
    });
  }

  dom.mapbox.addEventListener("wheel", onMapboxWheel);
  d3.select(dom.mapbox).call(ui.zoomD3);

  dom.overlay.addEventListener("mousedown", onOverlayMouseDown);
  dom.map.addEventListener("click", onMapClick);

  dom.introTextDismissButton.addEventListener("click", dismissIntroText);

  dom.zoomInButton.addEventListener("click", zoomIn);
  dom.zoomOutButton.addEventListener("click", zoomOut);

  dom.phrasesInput.addEventListener("input", onPhrasesInput);
  dom.phrasesInput.addEventListener("focus", onPhrasesInputFocus);
  dom.phrasesInput.value = state.phrasesQuery || "";
  dom.phrasesBox.addEventListener("focusout", onPhrasesBoxUnfocus);
  dom.phrasesBox.addEventListener("click", onPhrasesBoxClick);

  dom.infobarContainer.addEventListener("touchstart", startInfobarInteraction);
  dom.infobarContainer.addEventListener("touchend", endInfobarInteraction);
  dom.infobarContainer.addEventListener("mouseover", startInfobarInteraction);
  dom.infobarContainer.addEventListener("mouseout", endInfobarInteraction);

  dom.infobarAreaDescriptionExpandButton.addEventListener(
    "click",
    mobx.action(() => (state.infobar.areaInfo.expanded = true))
  );
  dom.infobarLanguageDescriptionExpandButton.addEventListener(
    "click",
    mobx.action(() => (state.infobar.languageInfo.expanded = true))
  );
  dom.infobarCloseButton.addEventListener("click", onInfobarCloseClick);

  renderInfobarGeneral();
}

function initData() {
  const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY_STATE));
  if (storedState) {
    Object.assign(state, storedState);
  }

  if (state.messages === DUMMY_MESSAGES) {
    loadMessages(state.locale);
  }

  d3.json("data/data.json").then(mobx.action(postInitData));
}

const postInitData = mobx.action((data) => {
  state.data = data;

  dom.preloader.classList.add("preloader-done");
  setTimeout(() => dom.preloader.remove(), 1000);

  if (state.introTextDismissed) {
    dismissIntroText(true);
  }

  setTimeout(autoActivatePins, 2000);

  const introTime = 15000;
  setTimeout(() => (state.introMode = false), introTime);
});

const deselectAll = mobx.action(() => {
  state.currentAreaCode = null;
  state.currentLanguage = null;
  state.currentPin = null;
  state.infobar.active = false;
  deactivatePins();

  inhibitAutoPin(4000);
});

function storeState() {
  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state.storeableState));
}

// ======================== MESSAGES ==============================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

const messagesCache = {};
const setMessages = mobx.action((locale, messages) => {
  messagesCache[locale] = messages;
  state.messages = messages;
});

function loadMessages(locale) {
  if (locale) {
    if (messagesCache[locale]) {
      setMessages(locale, messagesCache[locale]);
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.src = `messages/${locale.replace(/\W/g, "")}.js`;
      document.head.appendChild(script);
    }
  }
}

function renderMessages() {
  const messageElements = document.querySelectorAll(
    "[data-message],[data-message-placeholder],[data-message-title]"
  );
  const keyMap = {
    "data-message": "textContent",
    "data-message-placeholder": "placeholder",
    "data-message-title": "title",
  };
  for (const el of messageElements) {
    for (const [attr, valueKey] of Object.entries(keyMap)) {
      const messageKey = el.getAttribute(attr);
      if (messageKey) {
        const func = state.messages[messageKey];
        if (func) {
          el[valueKey] = func();
        } else {
          console.error(`Invalid message key: ${messageKey}`);
        }
      }
    }
  }

  // Special
  document.documentElement.lang = state.messages.bcp47();
  dom.logo.src = `images/${state.messages.logoSrc()}.png`;
}

// ======================== HUD ===================================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function updateZoomButtons() {
  dom.zoomOutButton.disabled = state.camera.zoom <= state.minZoom;
  dom.zoomInButton.disabled = state.camera.zoom >= state.maxZoom;
}

function renderPhrasesInputOptions() {
  const phrasesItemsD3 = dom.phrasesOptionsD3
    .selectAll(".phrases-item")
    .data(state.sortedPhrasesInputOptions);

  phrasesItemsD3.exit().remove();

  const enterPhrasesItemsD3 = phrasesItemsD3
    .enter()
    .append(() => cloneTemplate(dom.phrasesItemTemplate));

  phrasesItemsD3
    .merge(enterPhrasesItemsD3)
    .attr("data-id", (phrase) => phrase.id)
    .each(function (phrase) {
      const itemD3 = d3.select(this);

      itemD3.select(".phrases-item-title").text(phrase.text);

      // minus 1 - don't count English
      const count = Object.keys(state.phrases[phrase.id]).length - 1;

      itemD3
        .select(".phrases-item-indicator")
        .text(state.messages.nTranslations(count));
    });
}

// ======================== PINS ==================================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function createPin(phraseID, phrase, language) {
  return {
    id: createPin.id++,
    active: false,
    hover: false,
    language,
    phraseID,
    phrase,
    color: getLanguageColor(language),
    colorLight: getLanguageColorLight(language),
    colorDark: getLanguageColorDark(language),
    colorText: getLanguageColorText(language),
    areaCode: undefined,
    x: undefined,
    y: undefined,
  };
}
createPin.id = 0;

// Expensive operation!
const updatePins = mobx.action(() => {
  if (updatePins.enqueued) {
    // Another update is in progress
    return;
  }

  const [viewLeft, viewRight, viewTop, viewBottom] = getViewportInGeoSpace();

  // get areas visible in viewport
  const features = findFeaturesInRect(
    state.geo,
    viewLeft,
    viewTop,
    viewRight,
    viewBottom
  );

  const areaCodes = features.map((feature) => feature.properties.wikaCode);

  // allocate visible pins based on areas visible, current phrase, & language distribution
  let visiblePinLanguages = [];

  const proportionsData = state.data.languages.proportions;
  const totalsData = state.data.languages.totals;

  for (const language of Object.keys(state.currentPhrases)) {
    if (PIN_LANGUAGE_BLACKLIST.includes(language)) {
      continue;
    }

    const proportion = areaCodes.reduce((sum, areaCode) => {
      const count = proportionsData[areaCode][language] || 0;

      if (count > 0) {
        const areaProp = count / totalsData[areaCode];
        const langProp = count / totalsData[language];

        return (
          sum +
          areaProp * (1 - state.normalizedZoomLevel) +
          langProp * state.normalizedZoomLevel
        );
      } else {
        return sum;
      }
    }, 0);

    let proportionBudget = proportion;

    const isRegional = REGIONAL_LANUAGES.includes(language);
    proportionBudget +=
      (isRegional ? 0.6 : -0.5) * (1 - state.normalizedZoomLevel) ** 4;

    for (
      let i = 0;
      i < 24 &&
      proportionBudget >
        Math.max(1e-12, 0.4 * (1 - 2 * state.normalizedZoomLevel));
      i++, proportionBudget *= 0.7 - 0.3 * state.normalizedZoomLevel
    ) {
      visiblePinLanguages.push({
        language,
        sort: proportionBudget,
      });
    }
  }

  visiblePinLanguages = visiblePinLanguages
    .sort((a, b) => b.sort - a.sort)
    .map((obj) => obj.language);

  const removalBuffer = 1.0;

  // remove pins
  for (let i = state.pins.length - 1; i >= 0; i--) {
    const pin = state.pins[i];

    const isInViewport =
      pin.x >= viewLeft - removalBuffer &&
      pin.x <= viewRight + removalBuffer &&
      pin.y >= viewTop - removalBuffer &&
      pin.y <= viewBottom + removalBuffer;

    const allowed =
      pin === state.currentPin ||
      (state.currentPhraseID === pin.phraseID &&
        areaCodes.includes(pin.areaCode) &&
        visiblePinLanguages.includes(pin.language) &&
        isInViewport &&
        countSamePinsInArea(pin.areaCode, pin.language) <=
          computeMaxSamePinsPerArea(
            pin.areaCode,
            pin.language,
            proportionsData,
            totalsData
          ));

    if (!allowed) {
      state.pins.splice(i, 1);
    }
  }

  if (state.currentPin && !state.pins.includes(state.currentPin)) {
    deselectAll();
  }

  if (
    state.pins.length < PIN_MAX_COUNT &&
    state.pinAdditionInhibitUntil < Date.now()
  ) {
    // get pins not yet placed on map
    const unplacedPinLanguages = [...visiblePinLanguages];
    for (const pin of state.pins) {
      const index = unplacedPinLanguages.indexOf(pin.language);
      if (index >= 0) {
        unplacedPinLanguages.splice(index, 1);
      }
    }

    // add unplaced pins
    let pinsPerInterval = PINS_ADDED_PER_UPDATE + (state.introMode ? 2 : 0);
    const updateInterval = PIN_UPDATE_INTERVAL;

    for (const language of unplacedPinLanguages) {
      const pin = createPin(
        state.currentPhraseID,
        state.currentPhrases[language],
        language
      );
      if (
        placePin(
          features,
          areaCodes,
          pin,
          viewLeft - removalBuffer,
          viewRight + removalBuffer,
          viewTop - removalBuffer,
          viewBottom + removalBuffer
        )
      ) {
        state.pins.push(pin);

        if (--pinsPerInterval <= 0) {
          updatePins.enqueued = true;
          setTimeout(() => {
            updatePins.enqueued = false;
            updatePins();
          }, updateInterval);
          break;
        }
      }
    }
  }
});

// Expensive operation!
const placePin = mobx.action(
  (features, areaCodes, pin, limitLeft, limitRight, limitTop, limitBottom) => {
    const proportionsData = state.data.languages.proportions;
    const totalsData = state.data.languages.totals;

    let threshold = Math.max(0.004, 0.15 * (1 - 3 * state.normalizedZoomLevel));

    // curve the threshold based on how spread out the language is
    const languageTotal = totalsData[pin.language];
    const exponent = Math.atan(1 - languageTotal / 120) / (Math.PI / 2);
    threshold = threshold ** (2 ** exponent);

    // prioritize placing pin on the area with most speakers of the pin's language
    let pinAreaCode = getAreaWithMostSpeakers(pin.language, proportionsData);

    // if that area isn't visible, select another random area
    if (!areaCodes.includes(pinAreaCode)) {
      pinAreaCode = selectRandomAreaForLanguage(
        areaCodes,
        pin.language,
        proportionsData,
        totalsData,
        threshold
      );

      if (!pinAreaCode) {
        return false;
      }
    }

    // if area already has too many pins of the same language, select another random area
    let areaCodesLeft = areaCodes;
    while (
      countSamePinsInArea(pinAreaCode, pin.language) + 1 >
      computeMaxSamePinsPerArea(
        pinAreaCode,
        pin.language,
        proportionsData,
        totalsData
      )
    ) {
      areaCodesLeft = areaCodesLeft.filter((code) => code !== pinAreaCode);

      if (!areaCodesLeft.length) {
        return false;
      }

      pinAreaCode = selectRandomAreaForLanguage(
        areaCodesLeft,
        pin.language,
        proportionsData,
        totalsData,
        threshold
      );

      if (!pinAreaCode) {
        return false;
      }
    }

    // get area placement
    const feature = features.find(
      (feature) => feature.properties.wikaCode === pinAreaCode
    );
    const [x, y] = findPinPosition(
      feature,
      state.pins.filter((pin) => pin.areaCode === pinAreaCode)
    );

    if (x < limitLeft || x > limitRight || y < limitTop || y > limitBottom) {
      return false;
    }

    pin.areaCode = pinAreaCode;
    pin.x = x;
    pin.y = y;
    return true;
  }
);

function countSamePinsInArea(areaCode, language) {
  return state.pins.filter(
    (p) => p.areaCode === areaCode && p.language === language
  ).length;
}

function computeMaxSamePinsPerArea(
  areaCode,
  language,
  proportionsData,
  totalsData
) {
  return Math.round(
    clamp(
      0.4 *
        (0.6 + state.normalizedZoomLevel * 0.4) *
        Math.log1p(proportionsData[areaCode][language]),
      1,
      3
    )
  );
}

function autoActivatePins() {
  if (
    state.detailMode ||
    state.autoPinInhibitUntil > Date.now() ||
    state.currentAreaCode ||
    state.currentLanguage ||
    state.currentPin ||
    !state.pins.length ||
    state.pins.find((pin) => pin.hover)
  ) {
    setTimeout(autoActivatePins, 200);
    return;
  }

  mobx.runInAction(() => {
    // next language in cycle
    const language = selectAutoPinLanguage();

    if (!language) return;

    // select a random pin from selected language
    const [viewLeft, viewRight, viewTop, viewBottom] = getViewportInGeoSpace();
    const filteredPins = state.pins.filter(
      (pin) =>
        pin.language === language &&
        pin.x >= viewLeft &&
        pin.x <= viewRight &&
        pin.y >= viewTop &&
        pin.y <= viewBottom
    );

    if (!filteredPins.length) return;

    const pinIndex = Math.floor(Math.random() * filteredPins.length);
    const targetPin = filteredPins[pinIndex];

    // activate the pin then deactivate it some time later
    targetPin.active = true;
    setTimeout(
      mobx.action(() => {
        if (!targetPin.hover) {
          targetPin.active = false;
        }
      }),
      AUTO_PIN_TIME
    );
  });

  const delay = state.introMode
    ? 1600
    : AUTO_PIN_INTERVAL *
      (0.9 + Math.random() * 0.2) *
      (1 + 8 * state.normalizedZoomLevel ** 0.5);
  setTimeout(autoActivatePins, delay);
}

function selectAutoPinLanguage() {
  if (!state.autoPinLanguages.length) {
    const languages = state.pins
      .map((pin) => pin.language)
      .filter((value, index, self) => self.indexOf(value) === index);
    shuffleArray(languages);
    state.autoPinLanguages = languages;
  }

  while (state.autoPinLanguages.length) {
    const next = state.autoPinLanguages.shift();
    if (state.pins.some((pin) => pin.language === next)) {
      return next;
    }
  }
  return null;
}

// usually inhibit auto pins when user is interacting
function inhibitAutoPin(time) {
  state.autoPinInhibitUntil = Math.max(
    state.autoPinInhibitUntil,
    Date.now() + time
  );
}

// usually inhibit pin hover when map is moving
function inhibitPinHover(time) {
  state.pinHoverInhibitUntil = Math.max(
    state.pinHoverInhibitUntil,
    Date.now() + time
  );
}

// usually inhibit pin update when map is moving
function inhibitPinAddition(time) {
  state.pinAdditionInhibitUntil = Math.max(
    state.pinAdditionInhibitUntil,
    Date.now() + time
  );
}

function deactivatePins() {
  state.pins.forEach((pin) => (pin.active = false));
}

const selectPin = mobx.action((pin) => {
  state.currentPin = pin;
  state.currentLanguage = pin.language;
  state.currentAreaCode = pin.areaCode;

  clearInfobar();

  zoomToPin(pin, state.maxZoom, populateInfobar);
});

function zoomToPin(pin, zoom, callback = () => {}) {
  zoomToGeoPoint(pin.x, pin.y, zoom, callback);
}

function renderPins() {
  const pinsD3 = dom.overlayD3
    .selectAll(".pin")
    .data(state.pins, (pin) => pin.id);

  pinsD3.exit().classed("pin-exit", true).transition().delay(100).remove();

  const enterPinsD3 = pinsD3
    .enter()
    .append(() => cloneTemplate(dom.pinTemplate))
    .style("--pin-color", (pin) => pin.color)
    .style("--pin-color-light", (pin) => pin.colorLight)
    .style("--pin-color-dark", (pin) => pin.colorDark)
    .style("--pin-color-text", (pin) => pin.colorText)
    .each(function (pin) {
      const itemD3 = d3.select(this);

      const formattedLanguage = formatLanguage(pin.language);
      itemD3.select(".pin-label").text(formattedLanguage);
      itemD3.select(".bubble-title").text(formatPhrase(pin.phrase));
      itemD3.select(".bubble-subtitle").text(formattedLanguage);

      if (ui.hasHover) {
        itemD3
          .on("mouseover mousemove", () => {
            if (state.pinHoverInhibitUntil <= Date.now()) {
              if (!state.overviewMode || pin.active) {
                pin.hover = true;
                mouseHoverLocal.set(this, true);
              }
              if (!state.overviewMode) {
                deactivatePins();
                pin.active = true;
              }
            }
          })
          .on("mouseout", () => {
            mouseHoverLocal.set(this, false);
            setTimeout(() => {
              if (pin.hover) {
                inhibitAutoPin(2000);
              }
              const isStillHovering = mouseHoverLocal.get(this);
              pin.hover = pin.hover && isStillHovering;
              pin.active = pin.active && isStillHovering;
            }, 800);
          });
      }
    })
    .on("click", (pin) => onPinClick(pin));

  // entrance animation
  enterPinsD3.select(".person").each(function () {
    const personD3 = d3.select(this);
    personD3.classed("person-enter", true).on("animationend", () => {
      personD3.classed("person-enter", false).on("animationend", null);
    });
  });

  const headerHeight = 60;
  const bubbleMaxWidth = clamp(state.visibleViewportWidth * 0.4, 150, 300);
  const bubbleHeight = 120; // guess

  const screenPosLocal = d3.local();
  const mouseHoverLocal = d3.local();
  pinsD3
    .merge(enterPinsD3)
    .property(screenPosLocal, (pin) => projectToScreen([pin.x, pin.y]))
    .classed("pin-active", (pin) => pin.active)
    .classed("pin-selected", (pin) => pin === state.currentPin)
    .style("transform", function () {
      const screenPos = screenPosLocal.get(this);
      return `translate3d(${screenPos[0]}px, ${screenPos[1]}px, 0) translate(-50%, -50%)`;
    })
    .style(
      "z-index",
      (pin) =>
        geoYToZIndex(pin.y) +
        (pin.hover ? 30000 : 0) +
        (pin.active ? 10000 : 0) +
        (pin === state.currentPin ? 20000 : 0)
    )
    .select(".bubble")
    .classed("bubble-right", function () {
      return (
        screenPosLocal.get(this)[0] + state.visibleViewportOffsetX <
        state.windowWidth - bubbleMaxWidth
      );
    })
    .classed("bubble-left", function () {
      return !this.classList.contains("bubble-right");
    })
    .classed("bubble-bottom", function () {
      return (
        screenPosLocal.get(this)[1] - state.visibleViewportOffsetY <
        headerHeight + bubbleHeight
      );
    })
    .style("max-width", `${bubbleMaxWidth}px`);
}

// ======================== LABELS ================================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function createLabel(language) {
  return {
    language,
    x: undefined,
    y: undefined,
    color: getLanguageColor(language),
    colorLight: getLanguageColorLight(language),
    colorDark: getLanguageColorDark(language),
    colorText: getLanguageColorText(language),
    travelling: true,
    posScore: -Infinity,
  };
}

const updateLabels = mobx.action(() => {
  if (state.introMode) {
    return;
  }

  if (updateLabels.enqueued) {
    // Another update is in progress
    return;
  }

  if (!state.detailMode) {
    const onScreenPins = state.pins.filter((pin) => {
      const screenPos = projectToScreen([pin.x, pin.y]);
      let screenX = screenPos[0] - state.visibleViewportOffsetX;
      let screenY = screenPos[1] - state.visibleViewportOffsetY;
      return (
        screenX > 0 &&
        screenX < state.visibleViewportWidth &&
        screenY > 0 &&
        screenY < state.visibleViewportHeight
      );
    });

    // remove labels
    for (let i = state.labels.length - 1; i >= 0; i--) {
      const label = state.labels[i];
      if (!onScreenPins.some((pin) => pin.language === label.language)) {
        state.labels.splice(i, 1);
      }
    }

    const labelledLanguages = new Set(
      state.labels.map((label) => label.language)
    );

    // add new labels
    for (const pin of onScreenPins) {
      if (!labelledLanguages.has(pin.language)) {
        const label = createLabel(pin.language);
        labelledLanguages.add(pin.language);
        state.labels.push(label);
      }
    }

    const proportionsData = state.data.languages.proportions;
    const totalsData = state.data.languages.totals;

    if (state.overviewMode) {
      // Overview mode labels clusters of pins together
      for (const label of state.labels) {
        const langTotal = totalsData[label.language];
        const labelledPins = onScreenPins.filter(
          (p) =>
            p.language === label.language &&
            proportionsData[p.areaCode][p.language] / langTotal > 0.06
        );

        if (label._positionID === labelledPins.length) {
          continue;
        }

        if (labelledPins.length >= 3) {
          // label the "convex" hull formed by the pins
          const hul = hull(
            labelledPins.map((pin) => [pin.x, pin.y]),
            0.2
          );
          const insidePins = onScreenPins
            .filter(
              (p) =>
                p.language !== label.language &&
                pointToPolygonDist(p.x, p.y, [hul]) >= -0.5
            )
            .map((p) => [p.x, p.y]);

          const position = polylabel([hul], insidePins, 0.5, 0.2);

          label.x = position[0];
          label.y = position[1];
        } else if (labelledPins.length === 2) {
          const dx = labelledPins[0].x - labelledPins[1].x;
          const dy = labelledPins[0].y - labelledPins[1].y;
          if (dx * dx + dy * dy < 0.1) {
            label.x = (labelledPins[0].x + labelledPins[1].x) / 2;
            label.y = (labelledPins[0].y + labelledPins[1].y) / 2;
          } else {
            label.x = labelledPins[0].x;
            label.y = labelledPins[0].y;
          }
        } else if (labelledPins.length === 1) {
          label.x = labelledPins[0].x;
          label.y = labelledPins[0].y;
        }
        label._positionID = labelledPins.length;
      }

      // Collisions
      const labels = [...state.labels].sort((a, b) => a.y - b.y);
      const collisionHeight = 0.3 / (1 + 12 * state.normalizedZoomLevel);
      for (let i = 0; i < labels.length - 1; i++) {
        const label = labels[i];
        const next = labels[i + 1];
        if (next.y < label.y + collisionHeight) {
          next.y = label.y + collisionHeight;
        }
      }
    } else {
      // Mid zoom level will label individual pins
      for (const label of state.labels) {
        let bestWeight = 0;
        let bestPin = onScreenPins[0];

        for (const pin of onScreenPins) {
          if (pin.language === label.language) {
            const weight = proportionsData[pin.areaCode][pin.language];
            if (weight > bestWeight) {
              bestWeight = weight;
              bestPin = pin;
            }
          }
        }

        label.x = bestPin.x;
        label.y = bestPin.y;

        // Try to cluster
        const nearbyPins = onScreenPins.filter(
          (p) =>
            Math.hypot(p.x - bestPin.x, p.y - bestPin.y) < 1 && p !== bestPin
        );

        let n = 1;
        while (nearbyPins.length) {
          let nearestDist = Infinity;
          let nearestPinIndex = 0;

          for (let i = 0; i < nearbyPins.length; i++) {
            const pin = nearbyPins[i];
            const dx = bestPin.x - pin.x;
            const dy = bestPin.y - pin.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < nearestDist) {
              nearestDist = d2;
              nearestPinIndex = i;
            }
          }

          const nearestPin = nearbyPins[nearestPinIndex];
          if (nearestPin && nearestPin.language === label.language) {
            label.x = (label.x * n + nearestPin.x) / (n + 1);
            label.y = (label.y * n + nearestPin.y) / (n + 1);
            n++;

            nearbyPins.splice(nearestPinIndex, 1);
          } else {
            break;
          }
        }

        // Don't block the person icon
        if (n === 1) {
          label.y -= 0.06;
        }
      }
    }
  } else if (state.labels.length) {
    state.labels = [];
  }
});

function renderLabels() {
  const labelsD3 = dom.overlayD3
    .selectAll(".label")
    .data(state.labels, (label) => label.language);

  labelsD3.exit().remove();

  const enterLabelsD3 = labelsD3
    .enter()
    .append(() => cloneTemplate(dom.labelTemplate))
    .text((label) => formatLanguage(label.language))
    .style("--label-color", (label) => label.color)
    .style("--label-color-light", (label) => label.colorLight)
    .style("--label-color-dark", (label) => label.colorDark)
    .style("--label-color-text", (label) => label.colorText);

  labelsD3
    .merge(enterLabelsD3)
    .classed("label-travelling", (label) => label.travelling)
    .style("transform", (label) => {
      const screenPos = projectToScreen([label.x, label.y]);
      return `translate3d(${screenPos[0]}px, ${screenPos[1]}px, 0) translate(-50%, -50%)`;
    })
    .style("z-index", (label) => geoYToZIndex(label.y) + 1000);
}

// ======================== MAP ===================================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function updateViewport() {
  document.body.classList.toggle("detail-mode", state.detailMode);
  document.body.classList.toggle("overview-mode", state.overviewMode);

  dom.map.style.transform = `translate(${state.camera.x}px, ${state.camera.y}px) scale(${state.camera.zoom})`;
}

// Expensive operation!
const setupMap = mobx.action(() => {
  if (state.geo) {
    // Resize geo paths
    geo.projection.scale(1).translate([0, 0]);
    const paths = convertGeoObjectToPaths(state.geo, geo.projection);
    const bounds = findMultiPolygonBounds(paths);

    const scaleX = state.windowWidth / (bounds.max.x - bounds.min.x);
    const scaleY = state.windowHeight / (bounds.max.y - bounds.min.y);
    const scale = Math.min(scaleX, scaleY);

    const mapWidth = scale * (bounds.max.x - bounds.min.x) + 10;
    const mapHeight = scale * (bounds.max.y - bounds.min.y) + 10;
    state.mapWidth = mapWidth;
    state.mapHeight = mapHeight;

    const offsetX = mapWidth / 2 - (scale * (bounds.min.x + bounds.max.x)) / 2;
    const offsetY = mapHeight / 2 - (scale * (bounds.min.y + bounds.max.y)) / 2;

    geo.projection.scale(scale).translate([offsetX, offsetY]);
    state.mapPaths = convertGeoObjectToPaths(state.geo, ([x, y]) =>
      geo.projection([x, y]).map(Math.round)
    );

    // Setup initial camera
    const translatePadding = mapHeight * 0.25;
    const windowSize = Math.min(state.windowWidth, state.windowHeight);
    const windowFactor = Math.max(1, Math.log(1500 / windowSize));
    state.minZoom = 0.85;
    state.maxZoom = 10 * windowFactor;
    state.overviewModeZoomThreshold = 2 * windowFactor;
    dom.mapboxD3
      // init zoom extents
      .call(
        (ui.zoomD3 = ui.zoomD3
          .translateExtent([
            [-translatePadding, -translatePadding],
            [mapWidth + translatePadding, mapHeight + translatePadding],
          ])
          .scaleExtent([state.minZoom, state.maxZoom]))
      );

    if (!setupMap.ranOnce) {
      setupMap.ranOnce = true;

      const windowCenterX = state.windowWidth / 2;
      const windowCenterY = state.windowHeight / 2;
      // initial camera position
      dom.mapboxD3
        .call(
          ui.zoomD3.transform,
          d3.zoomIdentity
            .translate(windowCenterX, windowCenterY)
            .scale(1.5)
            .translate(-mapWidth / 2, -mapHeight / 2)
        )
        .transition()
        .ease(d3.easePolyOut.exponent(4))
        .duration(3000)
        .call(ui.zoomD3.scaleTo, state.minZoom);
    }
  }
});

function renderMap() {
  const svgPathsD3 = dom.svgD3
    .attr("width", state.mapWidth)
    .attr("height", state.mapHeight)
    .selectAll("path")
    .data(state.mapPaths);
  const enterSvgPathsD3 = svgPathsD3
    .enter()
    .append("path")
    .attr("class", "area");
  svgPathsD3
    .merge(enterSvgPathsD3)
    .classed("area-highlighted", (path) => {
      return state.currentPin && state.currentPin.areaCode === path.areaCode;
    })
    .classed("area-selected", (path) => {
      return !state.currentPin && state.currentAreaCode === path.areaCode;
    })
    .attr("d", d3.line().curve(d3.curveCardinalClosed.tension(0.3)))
    .on("click", onPathClick);
}

const selectArea = mobx.action((feature) => {
  state.currentAreaCode = feature.properties.wikaCode;
  state.currentLanguage = null;
  state.currentPin = null;

  clearInfobar();

  zoomToFeature(feature, state.maxZoom * 0.8, populateInfobar);
});

function zoomToFeature(feature, zoom, callback = () => {}) {
  zoomToGeoPoint(...findPinPosition(feature, []), zoom, callback);
}

function zoomToGeoPoint(geoX, geoY, zoom, callback) {
  const [mapX, mapY] = geo.projection([geoX, geoY]);
  const windowCenterX = state.windowWidth / 2;
  const windowCenterY = state.windowHeight / 2;

  const transform = d3.zoomIdentity
    .translate(windowCenterX, windowCenterY)
    .scale(zoom)
    .translate(-mapX, -mapY);

  const [screenX, screenY] = projectToScreen([geoX, geoY]);

  const normalizingDenominator = Math.max(windowCenterX, windowCenterY);
  const dx = (windowCenterX - screenX) / normalizingDenominator;
  const dy = (windowCenterY - screenY) / normalizingDenominator;
  const dz = 0.8 * (Math.log(state.camera.zoom) - Math.log(zoom));
  const distance = Math.hypot(dx, dy, dz);
  const scaledDistance = Math.max(200, 1400 * distance);

  const isNear = distance < 0.2;
  const duration = isNear ? scaledDistance : scaledDistance * 0.6;

  dom.mapboxD3
    .transition("wikaZoom")
    .ease(isNear ? d3.easeBackOut.overshoot(1) : d3.easePolyOut.exponent(2.5))
    .duration(duration)
    .call(ui.zoomD3.transform, transform)
    .on("end", callback);

  inhibitPinAddition(duration * 0.8);
}

function zoomIn() {
  dom.mapboxD3
    .transition()
    .ease(d3.easePolyOut.exponent(5))
    .duration(400)
    .call(ui.zoomD3.scaleBy, 2);
}

function zoomOut() {
  dom.mapboxD3
    .transition()
    .ease(d3.easePolyOut.exponent(5))
    .duration(400)
    .call(ui.zoomD3.scaleBy, 0.5);
}

function getViewportInGeoSpace() {
  const mapCenterX =
    (state.windowWidth / 2 - state.camera.x) / state.camera.zoom;
  const mapCenterY =
    (state.windowHeight / 2 - state.camera.y) / state.camera.zoom;
  const visibleMapWidth = state.visibleViewportWidth / 2 / state.camera.zoom;
  const visibleMapHeight = state.visibleViewportHeight / 2 / state.camera.zoom;

  let [viewLeft, viewTop] = geo.projection.invert([
    mapCenterX - visibleMapWidth,
    mapCenterY - visibleMapHeight,
  ]);
  let [viewRight, viewBottom] = geo.projection.invert([
    mapCenterX + visibleMapWidth,
    mapCenterY + visibleMapHeight,
  ]);

  if (viewLeft > viewRight) {
    [viewLeft, viewRight] = [viewRight, viewLeft];
  }
  if (viewTop > viewBottom) {
    [viewTop, viewBottom] = [viewBottom, viewTop];
  }

  return [viewLeft, viewRight, viewTop, viewBottom];
}

// ======================== INFOBAR ===============================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function clearInfobar() {
  state.infobar = {
    ...emptyInfoBar(),
    active: state.infobar.active,
    orientation: state.infobar.orientation,
  };
}

function emptyInfoBar() {
  return {
    active: false,
    loading: true,
    /** @type {"side"|"bottom"} */
    orientation: "side",
    color: undefined,
    headerTitle: "",
    headerSubtitle: "",
    headerIsPhrase: false,
    translationItems: [],
    areaInfo: {
      title: "",
      descriptionParagraphs: [],
      expanded: false,
    },
    languageInfo: {
      title: "",
      vitality: "",
      code: "",
      description: "",
      expanded: false,
    },
    localsInfo: {
      highlighted: false,
      title: "",
      description: "",
      items: [],
    },
    mediaItems: [],
    sources: [],
  };
}

function startInfobarInteraction() {
  dom.infobar.classList.add("infobar-interacting");
}

function endInfobarInteraction() {
  // wait for any scrolling to stop before removing the class
  let scrollTop = dom.infobar.scrollTop;
  const intervalID = setInterval(() => {
    if (dom.infobar.scrollTop === scrollTop) {
      clearInterval(intervalID);
      dom.infobar.classList.remove("infobar-interacting");
    }
    scrollTop = dom.infobar.scrollTop;
  }, 150);
}

const populateInfobar = mobx.action(() => {
  clearInfobar();

  const areaMetadata =
    state.currentAreaCode && state.data.metadata[state.currentAreaCode];
  const languageMetadata =
    state.currentLanguage && state.data.metadata[state.currentLanguage];

  state.infobar.active = state.currentAreaCode || state.currentLanguage;
  state.infobar.loading = false;

  // header
  state.infobar.color =
    state.currentLanguage && getLanguageColorLight(state.currentLanguage);

  if (state.currentPin && state.currentLanguage) {
    state.infobar.headerTitle = formatPhrase(
      state.currentPhrases[state.currentLanguage]
    );
    state.infobar.headerIsPhrase = true;
    state.infobar.headerSubtitle = formatLanguage(state.currentLanguage);
  } else if (state.currentLanguage) {
    state.infobar.headerTitle = formatLanguage(state.currentLanguage);
  } else if (state.currentAreaCode) {
    state.infobar.headerTitle = areaMetadata.name;
    state.infobar.headerIsPhrase = false;
  }

  // translation list
  if (state.currentPin && state.currentLanguage) {
    const languages = [...INFOBAR_LANGUAGES];

    // add major local language
    if (state.currentAreaCode) {
      const languageCounts =
        state.data.languages.proportions[state.currentAreaCode];
      let topLang = null;
      let topCount = 0;
      for (const [language, count] of Object.entries(languageCounts)) {
        if (count > topCount) {
          topLang = language;
          topCount = count;
        }
      }
      if (!languages.includes(topLang)) {
        languages.unshift(topLang);
      }
    }

    state.infobar.translationItems = languages
      .filter(
        (lang) =>
          lang && state.currentPhrases[lang] && lang !== state.currentLanguage
      )
      .map((lang) => ({
        title: state.currentPhrases[lang],
        subtitle: formatLanguage(lang),
        lang:
          (state.data.metadata[lang] && state.data.metadata[lang].tag) || "",
      }));
  }

  // area info
  if (areaMetadata) {
    state.infobar.areaInfo = {
      title: areaMetadata.name,
      simpleName: areaMetadata.simpleName,
      descriptionParagraphs: areaMetadata.descriptionParagraphs,
    };
  }

  // language info
  if (languageMetadata) {
    state.infobar.languageInfo = {
      title: languageMetadata.name,
      vitality: languageMetadata.vitality,
      code: languageMetadata.tag,
      description: languageMetadata.description,
    };
  }

  // language chart
  if (state.currentAreaCode) {
    const languageCounts =
      state.data.languages.proportions[state.currentAreaCode];
    const languageCountEntries = Object.entries(languageCounts);
    const totalLanguageCount = languageCountEntries.reduce(
      (total, [_, count]) => total + count,
      0
    );

    state.infobar.localsInfo = {
      highlighted: !!state.currentLanguage,
      title: "",
      description: "",
      items: languageCountEntries
        .map(([language, count]) => ({
          language,
          proportion: count / totalLanguageCount,
          color: getLanguageColor(language),
          colorDark: getLanguageColorDark(language),
          isSmall: count / totalLanguageCount < 0.2,
          isCurrent: language === state.currentLanguage,
          isHighlighted: language === state.currentLanguage,
          sort: language === "_others" ? 0 : count,
        }))
        .sort((a, b) => b.sort - a.sort),
    };

    // additional description about current language in area
    if (state.currentLanguage) {
      state.infobar.localsInfo.title = state.messages.languageCompared(
        formatLanguage(state.currentLanguage),
        areaMetadata.simpleName
      );

      // TODO Extract fraction estimation
      // estimate a simple fraction of population that speaks the current selected language
      const currentLanguageProportion =
        languageCounts[state.currentLanguage] / totalLanguageCount;
      let errorThreshold = 0.02;
      let currentDenominator = 0;
      let currentNumerator = 0;
      const maxDenominator = 10;
      while (++currentDenominator <= maxDenominator) {
        if (currentDenominator === maxDenominator) {
          errorThreshold = 0.5 / maxDenominator;
        }

        const lowNumerator = Math.floor(
          currentLanguageProportion * currentDenominator
        );
        const lowError = Math.abs(
          currentLanguageProportion - lowNumerator / currentDenominator
        );

        const highNumerator = Math.ceil(
          currentLanguageProportion * currentDenominator
        );
        const highError = Math.abs(
          currentLanguageProportion - highNumerator / currentDenominator
        );

        if (lowNumerator > 0 && lowError <= errorThreshold) {
          currentNumerator =
            lowError < highError ? lowNumerator : highNumerator;
          break;
        } else if (highError <= errorThreshold) {
          currentNumerator = highNumerator;
          break;
        }
      }

      state.infobar.localsInfo.description = state.messages.primaryLanguageDescription(
        formatLanguage(state.currentLanguage),
        currentNumerator,
        currentDenominator,
        areaMetadata.simpleName
      );
    } else {
      state.infobar.localsInfo.title = state.messages.languagesInPlace(
        areaMetadata.simpleName
      );
    }
  }

  // media list
  if (state.currentLanguage) {
    state.infobar.mediaItems = state.data.media.filter(
      (item) => item.language === state.currentLanguage
    );
  }

  state.infobar.sources = [
    "https://psa.gov.ph/statistics/census/population-and-housing/2010-CPH",
    ...(languageMetadata ? languageMetadata.sources : []),
    ...(languageMetadata && languageMetadata.vitality
      ? [
          "http://www.unesco.org/new/en/culture/themes/endangered-languages/language-vitality/",
        ]
      : []),
    ...(areaMetadata ? areaMetadata.sources : []),
  ].sort();
});

function renderInfobarGeneral() {
  const orientationIsSide = state.infobar.orientation === "side";
  const orientationIsBottom = state.infobar.orientation === "bottom";

  document.body.classList.toggle(
    "shift-infobar-side",
    state.infobar.active && orientationIsSide
  );
  document.body.classList.toggle(
    "shift-infobar-bottom",
    state.infobar.active && orientationIsBottom
  );

  dom.infobar.classList.toggle("infobar-active", state.infobar.active);
  dom.infobar.classList.toggle("infobar-loading", state.infobar.loading);

  dom.infobar.classList.toggle("infobar-side", orientationIsSide);
  dom.infobar.classList.toggle("infobar-bottom", orientationIsBottom);

  if (orientationIsBottom && !state.infobar.active) {
    dom.infobar.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (state.infobar.color) {
    dom.infobar.style.setProperty("--infobar-color", state.infobar.color);
  } else {
    dom.infobar.style.removeProperty("--infobar-color");
  }

  if (state.infobar.active) {
    dom.infobarHeaderTitle.textContent = formatPhrase(
      state.infobar.headerTitle
    );
    dom.infobarHeaderTitle.classList.toggle(
      "infobar-header-title-phrase",
      state.infobar.headerIsPhrase
    );
    dom.infobarHeaderSubtitle.textContent = formatLanguage(
      state.infobar.headerSubtitle
    );

    renderInfobarBaybayin();

    // Sources
    const sourceItemsD3 = dom.infobarSourceListD3
      .selectAll(".infobar-source-item")
      .data(state.infobar.sources);
    sourceItemsD3.exit().remove();
    const enterSourceItemsD3 = sourceItemsD3
      .enter()
      .append("a")
      .attr("target", "_blank")
      .attr("class", "infobar-source-item");
    sourceItemsD3
      .merge(enterSourceItemsD3)
      .text((url) => url)
      .attr("href", (url) => url);
  } else {
    endInfobarInteraction();
  }
}

function renderInfobarBaybayin() {
  // const sectionVisible = state.currentPin && state.currentLanguage === "tagalog";
  const sectionVisible = false;

  dom.infobarBaybayinSection.style.display = sectionVisible ? "block" : "none";

  if (sectionVisible) {
    dom.infobarBaybayin.textContent =
      state.currentPhrases[state.currentLanguage];
  }
}

function renderInfobarTranslationList() {
  const sectionVisible = state.infobar.translationItems.length;

  dom.infobarTranslationSection.style.display = sectionVisible
    ? "block"
    : "none";

  if (sectionVisible) {
    const translationItemsD3 = dom.infobarTranslationListD3
      .selectAll(".infobar-translation-item")
      .data(
        state.infobar.translationItems,
        (item) => `${item.title}:${item.subtitle}`
      );
    translationItemsD3.exit().remove();
    translationItemsD3
      .enter()
      .append(() => cloneTemplate(dom.infobarTranslationItemTemplate))
      .each(function (item) {
        const itemD3 = d3.select(this);
        itemD3
          .select(".infobar-translation-item-title")
          .attr("lang", item.lang)
          .text(formatPhrase(item.title));
        itemD3
          .select(".infobar-translation-item-subtitle")
          .text(formatLanguage(item.subtitle));
      });
  }
}

function renderInfobarAreaSection() {
  const sectionVisible = !!state.infobar.areaInfo.title;

  dom.infobarAreaSection.style.display = sectionVisible ? "block" : "none";

  if (sectionVisible) {
    dom.infobarAreaTitle.textContent = state.infobar.areaInfo.title;

    // Area description
    let visibleDescriptionParagraphs =
      state.infobar.areaInfo.descriptionParagraphs;

    let descriptionTruncated = false;
    if (!state.infobar.areaInfo.expanded) {
      const totalChars = visibleDescriptionParagraphs.reduce(
        (count, paragraph) => count + paragraph.length,
        0
      );
      if (totalChars > 300) {
        let characterBudget = 250;

        visibleDescriptionParagraphs = visibleDescriptionParagraphs
          .map((paragraph) => {
            const truncatedLength = Math.max(
              0,
              Math.min(paragraph.length, characterBudget)
            );
            const paragraphTruncated = truncatedLength < paragraph.length;
            characterBudget -= truncatedLength;
            descriptionTruncated |= paragraphTruncated;
            return paragraphTruncated && truncatedLength < 50
              ? ""
              : paragraphTruncated
              ? `${paragraph.slice(0, truncatedLength).trim()}…`
              : paragraph;
          })
          .filter((paragraph) => {
            const paragraphOmitted = !paragraph.length;
            descriptionTruncated |= paragraphOmitted;
            return !paragraphOmitted;
          });
      }
    }

    const descriptionItemsD3 = dom.infobarAreaDescriptionD3
      .selectAll("p")
      .data(
        visibleDescriptionParagraphs,
        (_, i) => `${state.infobar.areaInfo.title}:${i}`
      );
    descriptionItemsD3.exit().remove();
    const enterDescriptionItemsD3 = descriptionItemsD3.enter().append("p");
    descriptionItemsD3
      .merge(enterDescriptionItemsD3)
      .text((paragraph) => paragraph);

    dom.infobarAreaDescriptionExpandButton.style.display = descriptionTruncated
      ? "block"
      : "none";
  }
}

function renderInfobarLanguageSection() {
  const sectionVisible = !!state.infobar.languageInfo.title;

  dom.infobarLanguageSection.style.display = sectionVisible ? "block" : "none";

  if (sectionVisible) {
    dom.infobarLanguageTitle.textContent = state.infobar.languageInfo.title;

    const code = state.infobar.languageInfo.code;
    if (code) {
      dom.infobarLanguageCode.style.display = "flex";
      dom.infobarLanguageCodeValue.textContent = code;
    } else {
      dom.infobarLanguageCode.style.display = "none";
    }

    const vitality = state.infobar.languageInfo.vitality;
    if (vitality) {
      dom.infobarLanguageVitality.style.display = "block";
      const elements = dom.vitalityList.querySelectorAll(".vitality-item");
      for (const element of elements) {
        const value = element.dataset.value;
        element.classList.toggle("vitality-item-active", value === vitality);
      }
      dom.vitalityDescription.innerHTML = {
        safe: state.messages.vitalityDescriptionSafe,
        vulnerable: state.messages.vitalityDescriptionVulnerable,
        definitely_endangered:
          state.messages.vitalityDescriptionDefinitelyEndangered,
        severely_endangered:
          state.messages.vitalityDescriptionSeverelyEndangered,
        critically_endangered:
          state.messages.vitalityDescriptionCriticallyEndangered,
        extinct: state.messages.vitalityDescriptionExtinct,
      }[vitality]();
    } else {
      dom.infobarLanguageVitality.style.display = "none";
    }

    let description = state.infobar.languageInfo.description;
    let descriptionTruncated = false;
    if (!state.infobar.languageInfo.expanded) {
      if (description.length > 300) {
        description = `${description.slice(0, 250)}…`;
        descriptionTruncated = true;
      }
    }

    dom.infobarLanguageDescription.textContent = description;

    dom.infobarLanguageDescriptionExpandButton.style.display = descriptionTruncated
      ? "block"
      : "none";
  }
}

function renderInfobarLocalsSection() {
  const sectionVisible = state.infobar.localsInfo.items.length;

  dom.infobarLocalsSection.style.display = sectionVisible ? "block" : "none";

  if (sectionVisible) {
    dom.infobarLocalsTitle.innerHTML = state.infobar.localsInfo.title;
    dom.infobarLocalsDescription.innerHTML =
      state.infobar.localsInfo.description;

    const chartItemsD3 = dom.infobarLocalsChartD3
      .classed(
        "infobar-locals-chart-highlighted",
        state.infobar.localsInfo.highlighted
      )
      .on("mouseout", () => unhighlightInfobarChart())
      .selectAll(".infobar-locals-chart-item")
      .data(
        state.infobar.localsInfo.items,
        (item, i) => `${item.label}:${item.proportion}`
      );
    chartItemsD3.exit().remove();
    const enterChartItemsD3 = chartItemsD3
      .enter()
      .append(() => cloneTemplate(dom.infobarLocalsChartItemTemplate));
    chartItemsD3.merge(enterChartItemsD3).each(function (item) {
      const abbreviated = item.isSmall && !item.isHighlighted;

      const itemD3 = d3.select(this);
      itemD3
        .classed("infobar-locals-chart-item-small", item.isSmall)
        .classed("infobar-locals-chart-item-current", item.isCurrent)
        .classed("infobar-locals-chart-item-highlighted", item.isHighlighted)
        .style("flex-basis", 2 + item.proportion * 1e2 + "%") // add bias so smaller languages can get seen
        .style("z-index", (_, i) => 100 - i)
        .style("--chart-color", item.color)
        .style("--chart-color-dark", item.colorDark)
        .on("mouseover", (item) => highlightInfobarChart(item.language));

      let name = formatLanguage(item.language, state.messages).replace(
        /\W+/g,
        ""
      );
      if (abbreviated) {
        if (item.language === "_others") {
          name = "~";
        } else {
          const abbrLen = clamp(item.proportion * 40, 1, 3);
          if (name.length > abbrLen) {
            name = name.slice(0, abbrLen) + (item.proportion > 3e-2 ? "." : "");
          }
        }
      }
      itemD3.select(".infobar-locals-chart-item-name").text(name);

      const value = abbreviated
        ? Math.max(1, Math.round(item.proportion * 1e2))
        : item.proportion < 0.01
        ? "<1%"
        : item.proportion > 0.99
        ? ">99%"
        : Math.round(item.proportion * 1e2) + "%";
      itemD3.select(".infobar-locals-chart-item-value").text(value);
    });
  }
}

const highlightInfobarChart = mobx.action((language) => {
  state.infobar.localsInfo.highlighted = true;
  state.infobar.localsInfo.items = state.infobar.localsInfo.items.map(
    (item) => ({
      ...item,
      isHighlighted: item.language === language,
    })
  );
});

const unhighlightInfobarChart = mobx.action(() => {
  state.infobar.localsInfo.highlighted = !!state.currentLanguage;
  state.infobar.localsInfo.items = state.infobar.localsInfo.items.map(
    (item) => ({
      ...item,
      isHighlighted: item.isCurrent,
    })
  );
});

function renderInfobarMediaList() {
  const sectionVisible =
    state.infobar.active && state.infobar.mediaItems.length;

  dom.infobarMediaSection.style.display = sectionVisible ? "block" : "none";

  if (sectionVisible) {
    const mediaItemsD3 = dom.infobarMediaListD3
      .selectAll(".infobar-media-item")
      .data(state.infobar.mediaItems, (item) => `${item.url}`);
    mediaItemsD3.exit().remove();
    mediaItemsD3
      .enter()
      .append(() => cloneTemplate(dom.infobarMediaItemTemplate))
      .each(function (item) {
        const itemD3 = d3.select(this);
        itemD3.select(".infobar-media-item-title").text(item.title);
        itemD3.select(".infobar-media-item-description").text(item.description);
        itemD3.select(".infobar-media-item-link").attr("href", item.url);
        itemD3
          .select(".infobar-media-item-content")
          .html(generateMediaHTML(item.type, item.id));
      });
  } else {
    dom.infobarMediaListD3.selectAll(".infobar-media-item").remove();
  }
}

// ======================== HELPERS ===============================================================
// ------------------------------------------------------------------------------------------------
// ================================================================================================

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function projectToScreen(geoCoords) {
  let [x, y] = geo.projection(geoCoords);
  x *= state.camera.zoom;
  y *= state.camera.zoom;
  x += state.camera.x;
  y += state.camera.y;
  return [x, y];
}

function getCSSVariable(name) {
  const styles = window.getComputedStyle(document.body);
  return styles.getPropertyValue(name);
}

function cloneTemplate(templateELement) {
  return [...templateELement.content.cloneNode(true).childNodes].find(
    (node) => node instanceof Element
  );
}

function deepRead(any) {
  if (any) {
    if (typeof any === "object") {
      Object.values(any).forEach((value) => deepRead(value));
    }
    if (Array.isArray(any)) {
      for (const item of any) {
        deepRead(item);
      }
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function geoYToZIndex(y) {
  return Math.floor(1e3 - y * 1e1);
}

// 2k lines...
// i regret not using webpack
