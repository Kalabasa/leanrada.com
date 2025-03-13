import { shouldEvictSnapshot } from "../evict";

let passed = 0;
let total = 0;

function assert(message: string, condition: boolean) {
  total++;
  if (condition) {
    passed++;
  } else {
    console.error(`FAIL: ${message || "Assertion failed"}`);
  }
}

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
  "Medium-age entries 1+ weeks apart should be kept",
  !shouldEvictSnapshot(
    getTime("2024-09-15T00:00:00Z"),
    getTime("2024-09-07T00:00:00Z"),
    NOW
  )
);

assert(
  "Medium-age entries <1 week apart should be evicted",
  shouldEvictSnapshot(
    getTime("2024-09-15T00:00:00Z"),
    getTime("2024-09-09T00:00:00Z"),
    NOW
  )
);

// Test old entries (> 1 year old)
assert(
  "Old entries 2+ months apart should be kept",
  !shouldEvictSnapshot(
    getTime("2023-05-01T00:00:00Z"),
    getTime("2023-03-01T00:00:00Z"),
    NOW
  )
);

assert(
  "Old entries <2 months apart should be evicted",
  shouldEvictSnapshot(
    getTime("2023-05-01T00:00:00Z"),
    getTime("2023-03-15T00:00:00Z"),
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
  "Entries exactly 1 year old use weekly retention",
  !shouldEvictSnapshot(
    getTime("2024-03-13T10:00:00Z"), // Exactly 1 year old
    getTime("2024-03-06T10:00:00Z"), // 1 week before
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

console.log(`${passed}/${total} tests passed`);
