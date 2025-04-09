import { formatTimeOffset } from "../main";
import { createTest } from "./base";
const { assert, report } = createTest();

assert("0ms", formatTimeOffset(0) === "+0:00");

assert("1 minute", formatTimeOffset(60_000) === "+0:01");

assert("1 hour", formatTimeOffset(60 * 60_000) === "+1:00");

assert("1h 5m", formatTimeOffset(65 * 60_000) === "+1:05");

assert(
  "10h 30m",
  formatTimeOffset(10 * 60 * 60_000 + 30 * 60_000) === "+10:30"
);

report();
