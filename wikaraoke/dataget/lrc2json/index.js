let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let finalTime = null;
  const lines = input.split(/\r?\n/);
  const entries = [];

  for (const line of lines) {
    if (line.startsWith("[length:")) {
      const match = line.match(/\[length:(\d+):(\d+\.\d+)\]/);
      if (match) {
        const [, min, sec] = match;
        finalTime =
          Math.round((parseFloat(min) * 60 + parseFloat(sec)) * 100) / 100;
      }
      continue;
    }

    const timestampRegex = /\[(\d+):(\d+\.\d+)\]/g;
    const timestamps = [...line.matchAll(timestampRegex)];

    if (timestamps.length === 0) continue;

    const text = line.replace(timestampRegex, "").trim();
    for (const match of timestamps) {
      const [, min, sec] = match;
      const time =
        Math.round((parseFloat(min) * 60 + parseFloat(sec)) * 100) / 100;
      entries.push({ time, text });
    }
  }

  entries.sort((a, b) => a.time - b.time);

  for (let i = 0; i < entries.length; i++) {
    const isLast = i === entries.length - 1;
    const start = entries[i].time;
    const end = !isLast ? entries[i + 1].time : finalTime ?? start + 10;
    const text = entries[i].text;
    const sep = isLast ? "" : ",";
    const textJson = JSON.stringify(text);
    console.log(
      `{ "start": ${start}, "end": ${end}, "text": ${textJson} }${sep}`
    );
  }
});
