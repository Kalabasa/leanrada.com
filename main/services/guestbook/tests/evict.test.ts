import { shouldEvictSnapshot } from "../evict";
import { createTest } from "./base";
const { assert, report } = createTest();

function getTime(dateString: string) {
  return new Date(dateString).getTime();
}

const NOW = getTime("2025-03-13T10:00:00Z");

// Test recent entries (< 30 days old)
assert(
  "Recent entries 1+ days apart should be kept",
  !shouldEvictSnapshot(
    getTime("2025-03-01T00:00:00Z"),
    getTime("2025-02-28T00:00:00Z"),
    NOW
  )
);

assert(
  "Recent entries <1 day apart should be evicted",
  shouldEvictSnapshot(
    getTime("2025-03-01T00:00:00Z"),
    getTime("2025-02-28T23:00:00Z"),
    NOW
  )
);

// Test medium-age entries (30 days to 1 year old)
assert(
  "Medium-age entries 1+ months apart should be kept",
  !shouldEvictSnapshot(
    getTime("2024-09-15T00:00:00Z"),
    getTime("2024-08-01T00:00:00Z"),
    NOW
  )
);

assert(
  "Medium-age entries <1 month apart should be evicted",
  shouldEvictSnapshot(
    getTime("2024-09-15T00:00:00Z"),
    getTime("2024-09-01T00:00:00Z"),
    NOW
  )
);

// Test old entries (> 1 year old)
assert(
  "Old entries 1+ years apart should be kept",
  !shouldEvictSnapshot(
    getTime("2023-03-01T00:00:00Z"),
    getTime("2022-03-01T00:00:00Z"),
    NOW
  )
);

assert(
  "Old entries <1 year apart should be evicted",
  shouldEvictSnapshot(
    getTime("2023-05-01T00:00:00Z"),
    getTime("2022-09-01T00:00:00Z"),
    NOW
  )
);

// Test boundary cases
assert(
  "Entries exactly 30 days old use daily retention",
  !shouldEvictSnapshot(
    getTime("2025-02-11T10:00:00Z"), // Exactly 30 days old
    getTime("2025-02-10T10:00:00Z"), // 1 day before
    NOW
  )
);

assert(
  "Entries exactly 1 year old use monthly retention",
  !shouldEvictSnapshot(
    getTime("2024-03-13T10:00:00Z"), // Exactly 1 year old
    getTime("2024-02-12T10:00:00Z"), // 1 week before
    NOW
  )
);

try {
  shouldEvictSnapshot(
    getTime("2025-03-01T00:00:00Z"),
    getTime("2025-03-02T00:00:00Z"),
    NOW
  );
  assert("Should enforce ascending order", false);
} catch (e) {}

report();