const jsonPath = "/notes/index.generated.combined.json";

export async function loadNotesIndex() {
  const controller = new AbortController();
  const response = await fetch(jsonPath, {
    cache: "force-cache",
    signal: controller.signal,
  });
  const dateHeader = response.headers.get("date");
  const time = dateHeader ? new Date(dateHeader).getTime() : 0;
  if (time > Date.now() - 30 * 24 * 60 * 60_000) {
    // if newer than 30 days
    return await response.json();
  } else {
    controller.abort();
    const newResponse = await fetch(jsonPath);
    return await newResponse.json();
  }
}

export async function loadNote(href) {
  const index = await loadNotesIndex();
  const note = index.find((item) => item.href === href);
  if (note) {
    return { index, note };
  }

  // bust cache if not found
  const response = await fetch(jsonPath + `?cachebust=${encodeURIComponent(href)}`);
  const index2 = await response.json();
  const note2 = index2.find((item) => item.href === href);
  if (note2) {
    return {
      index: index2,
      note: note2,
    };
  }

  return null;
}
