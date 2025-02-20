export function populateSuggestions(
  suggestionsIndex,
  references,
  backReferences,
  maxSmartSuggestions,
  maxSuggestions
) {
  for (let i = 0; i < suggestionsIndex.length; i++) {
    const item = suggestionsIndex[i];

    // suggest references
    const refs = [
      ...(references.get(item.href) ?? []),
      ...(backReferences.get(item.href) ?? []),
    ];

    item.suggestions = refs.filter(unique).slice(0, maxSmartSuggestions);

    // suggest by tag
    if (item.suggestions < maxSmartSuggestions) {
      const cotagged = suggestionsIndex
        .filter((other) => other !== item)
        .map((other) => ({
          href: other.href,
          score: other.tags.reduce(
            (score, otherTag) =>
              item.tags.includes(otherTag) ? score + 1 : score,
            0
          ),
        }))
        .filter((other) => other.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((other) => other.href);
      item.suggestions = item.suggestions
        .concat(cotagged)
        .filter(unique)
        .slice(0, maxSmartSuggestions);
    }

    // suggest notes in sequence
    for (
      let j = (i + 1) % suggestionsIndex.length;
      item.suggestions.length < maxSuggestions && j !== i;
      j = (j + 1) % suggestionsIndex.length
    ) {
      const other = suggestionsIndex[j];
      if (!item.suggestions.includes(other.href)) {
        item.suggestions.push(other.href);
      }
    }

    console.log("suggestions for", item.href, item.suggestions);
  }
}

function unique(value, index, array) {
  return array.indexOf(value) === index;
}
