import assert from "node:assert/strict";
import test from "node:test";
import { consumeIdentificationLimit } from "../functions/utils/rate-limit.js";

function createRateLimitDb() {
  const events = [];

  return {
    events,
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) {
          return { ...statement, values };
        },
        async first() {
          const [burstStart, rateKey, dailyStart] = this.values;
          const matching = events.filter(
            (event) =>
              event.rateKey === rateKey && event.createdAt >= dailyStart
          );

          return {
            burst_count: matching.filter(
              (event) => event.createdAt >= burstStart
            ).length,
            daily_count: matching.length,
          };
        },
        async run() {
          if (sql.includes("DELETE FROM rate_limit_events")) {
            const [cutoff] = this.values;

            for (let index = events.length - 1; index >= 0; index -= 1) {
              if (events[index].createdAt < cutoff) {
                events.splice(index, 1);
              }
            }
          }

          return { meta: { changes: 1 } };
        },
      };

      return statement;
    },
    async batch(statements) {
      for (const statement of statements) {
        if (statement.sql.includes("INSERT INTO rate_limit_events")) {
          const [rateKey, createdAt] = statement.values;
          events.push({ rateKey, createdAt });
        }
      }

      return statements.map(() => ({ success: true }));
    },
  };
}

function createRequest(ip) {
  return new Request("https://slabworth.test/api/identify", {
    headers: {
      "CF-Connecting-IP": ip,
    },
  });
}

test("identification limiter enforces burst and daily limits without storing raw IPs", async () => {
  const db = createRateLimitDb();
  const originalNow = Date.now;
  let now = Date.UTC(2026, 7, 15, 0, 0, 0);

  Date.now = () => now;

  try {
    for (let index = 0; index < 5; index += 1) {
      const result = await consumeIdentificationLimit({
        db,
        request: createRequest("203.0.113.10"),
        sessionId: "burst-session",
      });

      assert.equal(result.allowed, true);
    }

    const burstBlocked = await consumeIdentificationLimit({
      db,
      request: createRequest("203.0.113.10"),
      sessionId: "burst-session",
    });

    assert.equal(burstBlocked.allowed, false);
    assert.equal(burstBlocked.retryAfterSeconds, 600);

    for (let index = 0; index < 20; index += 1) {
      now += 601_000;

      const result = await consumeIdentificationLimit({
        db,
        request: createRequest("203.0.113.20"),
        sessionId: "daily-session",
      });

      assert.equal(result.allowed, true);
    }

    now += 601_000;

    const dailyBlocked = await consumeIdentificationLimit({
      db,
      request: createRequest("203.0.113.20"),
      sessionId: "daily-session",
    });

    assert.equal(dailyBlocked.allowed, false);
    assert.equal(dailyBlocked.retryAfterSeconds, 86_400);
    assert.equal(
      db.events.some((event) => event.rateKey.includes("203.0.113")),
      false
    );
  } finally {
    Date.now = originalNow;
  }
});
