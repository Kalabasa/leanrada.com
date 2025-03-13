// Time constants in milliseconds
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Retention policy thresholds
const THRESHOLDS = {
  RECENT: 30 * MS_PER_DAY, // 30 days
  MEDIUM: 365 * MS_PER_DAY, // 1 year
} as const;

// Retention frequencies
const RETENTION_FREQUENCY = {
  DAILY: MS_PER_DAY, // Keep 1 per day
  WEEKLY: 7 * MS_PER_DAY, // Keep 1 per week
  BI_MONTHLY: 2 * 30 * MS_PER_DAY, // Keep 1 per 2 months
} as const;

/**
 * Determines whether a snapshot should be evicted from the cache based on its age.
 *
 * Retention policy:
 * - Entries < 30 days old: Keep max 1 per day
 * - Entries 30 days to 1 year old: Keep max 1 per week
 * - Entries > 1 year old: Keep max 1 per 2 months
 *
 * @param snapshotTime - Timestamp of the snapshot being evaluated
 * @param lastSnapshotTime - Timestamp of the last snapshot we decided to keep
 * @param now - Current timestamp (milliseconds since epoch)
 * @returns True if the snapshot should be evicted, false if it should be kept
 */
export function shouldEvictSnapshot(
  snapshotTime: number,
  lastSnapshotTime: number,
  now: number
): boolean {
  if (snapshotTime < lastSnapshotTime) {
    throw new Error("Expected snapshots in ascending chronological order");
  }

  const age = now - snapshotTime;

  // Determine required time gap between snapshots based on age
  let requiredGap: number;

  if (age <= THRESHOLDS.RECENT) {
    requiredGap = RETENTION_FREQUENCY.DAILY;
  } else if (age <= THRESHOLDS.MEDIUM) {
    requiredGap = RETENTION_FREQUENCY.WEEKLY;
  } else {
    requiredGap = RETENTION_FREQUENCY.BI_MONTHLY;
  }

  // Evict if this snapshot is too close to the last kept snapshot
  return snapshotTime - lastSnapshotTime < requiredGap;
}
