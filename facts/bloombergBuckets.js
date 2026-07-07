export const BLOOMBERG_BUCKETS = Object.freeze([10, 50, 100, 1000]);

export function bucketTimestamp(timestamp, bucketMs) {
  const time = Number(timestamp) || Date.now();
  const size = BLOOMBERG_BUCKETS.includes(Number(bucketMs)) ? Number(bucketMs) : 1000;
  return Math.floor(time / size) * size;
}
