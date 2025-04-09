import { checkSpam } from "../spam";
import { createTest } from "./base";
const { assert, report } = createTest();

const common = { timeSpentMs: "4000", text: "Hello" };

assert(
  "Having honeypot is spam",
  checkSpam({ ...common, website: "http://example.com" } as any).isSpam
);

assert(
  "Missing honeypot is not spam",
  !checkSpam({ ...common, website: "" } as any).isSpam
);

assert(
  "Fast submission is spam",
  checkSpam({ ...common, timeSpentMs: "2000" } as any).isSpam
);

assert(
  "Long time spent is not spam",
  !checkSpam({ ...common, timeSpentMs: "4000" } as any).isSpam
);

assert(
  "Detected website is spam",
  checkSpam({ ...common, text: "Visit gpt4geeks.com for great info" } as any)
    .isSpam
);

assert(
  "Single valid link is not spam",
  !checkSpam({ ...common, text: "Check out http://example.com" } as any).isSpam
);

assert(
  "Multiple spammy links are spam",
  checkSpam({
    ...common,
    text: "Visit gpt4geeks.com and chatgptguide.com",
  } as any).isSpam
);

report();
