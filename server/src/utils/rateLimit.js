const buckets = new Map();

function isRateLimited(key, limit, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return bucket.count > limit;
}

function clearRateLimit(key) {
  buckets.delete(key);
}

module.exports = {
  isRateLimited,
  clearRateLimit,
};
