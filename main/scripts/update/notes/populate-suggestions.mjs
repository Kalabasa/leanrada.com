export function populateSuggestions({
  notes,
  noteReferences,
  maxSmartSuggestions,
  maxSuggestions,
}) {
  for (let i = 0; i < notes.length; i++) {
    const item = notes[i];

    // suggest references
    const refs = Array.from(noteReferences.get(item.href) ?? []);
    item.suggestions = refs
      .filter((otherHref) => otherHref !== item.href)
      .map((href) => ({ href, reason: "ref" }))
      .filter(uniqueHref)
      .slice(0, maxSmartSuggestions);

    // suggest by tag
    if (item.suggestions < maxSmartSuggestions) {
      const cotagged = notes
        .filter((other) => other !== item && (!item.public || other.public))
        .map((other) => ({
          href: other.href,
          score: computeScore(other, item),
        }))
        .filter((other) => other.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((other) => ({ href: other.href, reason: "tag" }));
      item.suggestions = item.suggestions
        .concat(cotagged)
        .filter(uniqueHref)
        .slice(0, maxSmartSuggestions);
    }

    // suggest notes in sequence
    for (
      let j = (i + 1) % notes.length;
      item.suggestions.length < maxSuggestions && j !== i;
      j = (j + 1) % notes.length
    ) {
      const other = notes[j];
      if (!other.href.startsWith("/notes/")) continue;
      if (item.public && !other.public) continue;
      if (item.suggestions.every((s) => s.href !== other.href)) {
        item.suggestions.push({ href: other.href, reason: "next" });
      }
    }
  }
}

function computeScore(a, b) {
  const tagScore = a.tags.reduce(
    (score, aTag) => (b.tags.includes(aTag) ? score + 1 : score),
    0
  );

  if (tagScore <= 0) return 0;

  const aTime = new Date(a.date).getTime();
  const bTime = new Date(b.date).getTime();
  const dateScore = 1e9 / (1e9 + Math.abs(aTime - bTime));

  return tagScore + dateScore;
}

function uniqueHref(value, index, array) {
  return array.findIndex((item) => item.href === value.href) === index;
}
