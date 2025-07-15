let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const lines = input.split(/\r?\n/);
  const entries = [];

  // SRT timestamp pattern: "00:01:23,456"
  const timestampRegex = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

  let i = 0;
  while (i < lines.length) {
    // SRT blocks: index line, timestamp line, text lines, blank line

    // Skip index line (number)
    if (!lines[i].trim() || isNaN(Number(lines[i].trim()))) {
      i++;
      continue;
    }
    i++;

    if (i >= lines.length) break;

    const tsLine = lines[i].trim();
    const match = tsLine.match(timestampRegex);
    if (!match) {
      i++;
      continue;
    }
    i++;

    const start =
      parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseInt(match[3]) +
      parseInt(match[4]) / 1000;

    const end =
      parseInt(match[5]) * 3600 +
      parseInt(match[6]) * 60 +
      parseInt(match[7]) +
      parseInt(match[8]) / 1000;

    let textLines = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }
    // skip blank line
    i++;

    const text = textLines.join("\n");
    entries.push({ start, end, text });
  }

  for (let j = 0; j < entries.length - 1; j++) {
    if (entries[j].end > entries[j + 1].start) {
      entries[j].end = entries[j + 1].start;
    }
  }

  for (let j = 0; j < entries.length; j++) {
    const isLast = j === entries.length - 1;
    const entry = entries[j];
    const sep = isLast ? "" : ",";
    console.log(
      JSON.stringify({
        start: entry.start,
        end: entry.end,
        text: entry.text,
      }) + sep
    );
  }
});
