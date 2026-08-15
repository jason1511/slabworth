const BURST_LIMIT = 5;
const BURST_WINDOW_SECONDS = 10 * 60;
const DAILY_LIMIT = 20;
const DAILY_WINDOW_SECONDS = 24 * 60 * 60;

let schemaPromise;

async function ensureRateLimitSchema(db) {
  if (!schemaPromise) {
    schemaPromise = db.batch([
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS rate_limit_events (
          rate_key TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
        `
      ),
      db.prepare(
        `
        CREATE INDEX IF NOT EXISTS idx_rate_limit_events_key_created_at
        ON rate_limit_events (rate_key, created_at)
        `
      ),
      db.prepare(
        `
        CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at
        ON rate_limit_events (created_at)
        `
      ),
    ]);
  }

  try {
    await schemaPromise;
  } catch (error) {
    schemaPromise = null;
    throw error;
  }
}

async function hashRateKey(namespace, value) {
  const input = new TextEncoder().encode(`${namespace}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildRateKeys(request, sessionId) {
  const keys = [await hashRateKey("session", sessionId)];
  const clientIp = request.headers.get("CF-Connecting-IP") || "";

  if (clientIp) {
    keys.push(await hashRateKey("ip", clientIp));
  }

  return keys;
}

async function getUsage(db, rateKey, now) {
  const burstStart = now - BURST_WINDOW_SECONDS;
  const dailyStart = now - DAILY_WINDOW_SECONDS;

  const row = await db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS burst_count,
        COUNT(*) AS daily_count
      FROM rate_limit_events
      WHERE rate_key = ?
      AND created_at >= ?
      `
    )
    .bind(burstStart, rateKey, dailyStart)
    .first();

  return {
    burstCount: Number(row?.burst_count || 0),
    dailyCount: Number(row?.daily_count || 0),
  };
}

export async function consumeIdentificationLimit({ db, request, sessionId }) {
  await ensureRateLimitSchema(db);

  const now = Math.floor(Date.now() / 1000);
  const rateKeys = await buildRateKeys(request, sessionId);

  for (const rateKey of rateKeys) {
    const usage = await getUsage(db, rateKey, now);

    if (usage.burstCount >= BURST_LIMIT) {
      return {
        allowed: false,
        retryAfterSeconds: BURST_WINDOW_SECONDS,
        message:
          "Too many card analyses in a short period. Please try again in about 10 minutes.",
      };
    }

    if (usage.dailyCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        retryAfterSeconds: DAILY_WINDOW_SECONDS,
        message:
          "The daily card-analysis limit has been reached. Please try again tomorrow.",
      };
    }
  }

  await db.batch(
    rateKeys.map((rateKey) =>
      db
        .prepare(
          `
          INSERT INTO rate_limit_events (rate_key, created_at)
          VALUES (?, ?)
          `
        )
        .bind(rateKey, now)
    )
  );

  await db
    .prepare(
      `
      DELETE FROM rate_limit_events
      WHERE created_at < ?
      `
    )
    .bind(now - DAILY_WINDOW_SECONDS)
    .run();

  return {
    allowed: true,
  };
}

export const IDENTIFICATION_LIMITS = {
  burst: BURST_LIMIT,
  burstWindowSeconds: BURST_WINDOW_SECONDS,
  daily: DAILY_LIMIT,
  dailyWindowSeconds: DAILY_WINDOW_SECONDS,
};
