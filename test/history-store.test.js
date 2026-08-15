import assert from "node:assert/strict";
import test from "node:test";
import { updateAnalysisMatch } from "../functions/utils/history-store.js";

test("updateAnalysisMatch persists corrected searchable fields and result JSON", async () => {
  let capturedValues = [];

  const db = {
    prepare(sql) {
      assert.match(sql, /UPDATE analyses/);

      return {
        bind(...values) {
          capturedValues = values;

          return {
            async run() {
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };

  const result = {
    detectedCard: {
      name: "Pikachu",
      set: "Base Set",
      number: "25/102",
      rarity: "Rare",
    },
    grade: {
      score: 8,
    },
    matchStatus: {
      status: "confirmed",
    },
  };

  const didUpdate = await updateAnalysisMatch({
    db,
    id: "analysis-1",
    sessionId: "session-1",
    result,
  });

  assert.equal(didUpdate, true);
  assert.deepEqual(capturedValues.slice(0, 5), [
    "Pikachu",
    "Base Set",
    "25/102",
    "Rare",
    "confirmed",
  ]);
  assert.deepEqual(JSON.parse(capturedValues[5]), result);
  assert.equal(capturedValues[6], "analysis-1");
  assert.equal(capturedValues[7], "session-1");
});

test("updateAnalysisMatch reports when no session-owned row changed", async () => {
  const db = {
    prepare() {
      return {
        bind() {
          return {
            async run() {
              return { meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };

  const didUpdate = await updateAnalysisMatch({
    db,
    id: "analysis-1",
    sessionId: "wrong-session",
    result: { detectedCard: {}, matchStatus: {} },
  });

  assert.equal(didUpdate, false);
});
