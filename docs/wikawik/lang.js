/**
 * Get the area code where the most spoken language is the specified language.
 */
function getAreaWithMostSpeakers(language, proportionsData) {
  if (getAreaWithMostSpeakers.cache.has(language)) {
    return getAreaWithMostSpeakers.cache.get(language);
  }

  let bestScore = -Infinity;
  let bestArea = null;
  for (const [code, values] of Object.entries(proportionsData)) {
    const score = values[language] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestArea = code;
    }
  }

  getAreaWithMostSpeakers.cache.set(language, bestArea);
  return bestArea;
}
getAreaWithMostSpeakers.cache = new Map();

function selectRandomAreaForLanguage(
  areaCodes,
  language,
  proportionsData,
  totalsData,
  threshold = 0
) {
  const proportions = new Map();

  let total = 0;
  for (const areaCode of areaCodes) {
    const map = proportionsData[areaCode];

    const areaTotal = totalsData[areaCode];
    let proportion = (map[language] || 0) / areaTotal;

    proportions.set(areaCode, proportion);

    total += proportion;
  }

  if (total === 0) {
    return null;
  }

  const selection = Math.random() * total;

  let run = 0;
  for (const areaCode of areaCodes) {
    const proportion = proportions.get(areaCode);
    run += proportion;
    if (proportion >= threshold && run >= selection) {
      return areaCode;
    }
  }

  return null;
}

function getLanguageColorRaw(language) {
  if (getLanguageColorRaw.cache.has(language)) {
    return getLanguageColorRaw.cache.get(language);
  }

  const hash = Math.abs(
    hashString(language + language.slice(0, 3) + language.slice(0, 2))
  );
  const t = hash * 0.61803398875;
  const tier = fractal((t * 12) % 1);

  const hue = 360 * (t % 1);
  const saturation = 100;
  const lightness =
    100 - (100 - (25 + 70 * tier)) * 0.27 ** (1 - hueToLightnessBias(hue));

  const color = { hue, saturation, lightness };
  getLanguageColorRaw.cache.set(language, color);
  return color;
}
getLanguageColorRaw.cache = new Map();

function getLanguageColor(language) {
  const color = getLanguageColorRaw(language);
  return `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
}

function getLanguageColorLight(language) {
  const color = getLanguageColorRaw(language);
  const lightness = 60 + 40 * (color.lightness / 100) ** 0.5;
  return `hsl(${color.hue}, ${color.saturation}%, ${lightness}%)`;
}

function getLanguageColorDark(language) {
  const color = getLanguageColorRaw(language);

  const hash = Math.abs(hashString(language));
  const t = hash * 0.61803398875;
  const sheen = fractal((t * 5) % 1) ** 4;
  let delta = 240 - color.hue;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  const hue = color.hue + delta * sheen;
  const lightness = 20 + 30 * (color.lightness / 100) ** 1.5;

  return `hsl(${hue}, ${color.saturation * 0.7}%, ${lightness}%)`;
}

function getLanguageColorText(language) {
  const color = getLanguageColorDark(language);
  return `hsl(${color.hue}, ${color.saturation * 0.8}%, 15%)`;
}

function formatPhrase(phrase) {
  return phrase.slice(0, 1).toLocaleUpperCase() + phrase.slice(1);
}

function formatLanguage(language, messages = null) {
  if (language === "_others") {
    return messages ? messages.others() : language;
  }

  return language
    .split(/([ -]?[^ -]+)/g)
    .map((word) => {
      const first = word.charAt(0);
      const start = first === " " || first === "-" ? 1 : 0;
      if (first !== "-" || word.length - start >= 4) {
        return (
          word.slice(0, start) +
          word.slice(start, start + 1).toLocaleUpperCase() +
          word.slice(start + 1)
        );
      } else {
        return word;
      }
    })
    .join("");
}

// Helper function for generating language colors
function fractal(x, s = 1) {
  if (s >= 256) {
    return x;
  } else {
    return (
      (x < 0.5 ? fractal(1 - x * 2, s * 2) : fractal(2 - x * 2, s * 2) + 1) / 2
    );
  }
}

// Helper function for generating language colors
function hashString(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const chr = string.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Helper function for generating language colors
function hueToLightnessBias(hue) {
  const h = hue / 360;
  const q = 1;
  const p = 0;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return 1 * 6 * t;
  if (t < 1 / 2) return 1;
  if (t < 2 / 3) return 1 * (2 / 3 - t) * 6;
  return 0;
}
