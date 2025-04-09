import { sampleSpan } from "../main";
import { createTest } from "./base";
const { assert, report } = createTest();

const span = (label: string, start: number, end: number) => ({
  label,
  startRelTime: start,
  endRelTime: end,
});

const relTime = (h: number, m = 0, s = 0) => ((h * 60 + m) * 60 + s) * 1000;

const utc10 = new Date("2024-01-01T10:00:00Z").getTime();

assert("No span", sampleSpan([], utc10).span === null);

assert(
  "Current when time is inside span",
  sampleSpan([span("a", relTime(10), relTime(10, 20))], utc10).current === true
);

assert(
  "Nearest past span when no current match",
  sampleSpan(
    [
      span("a", relTime(9), relTime(9, 5)),
      span("b", relTime(9, 50), relTime(9, 55)),
      span("c", relTime(10, 5), relTime(10, 10)),
    ],
    utc10
  ).span?.label === "b"
);

assert(
  "Not current when outside all spans",
  sampleSpan([span("a", relTime(9, 50), relTime(9, 55))], utc10).current ===
    false
);

report();
