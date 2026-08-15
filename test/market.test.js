import assert from "node:assert/strict";
import test from "node:test";
import {
  getMarketSummary,
  getValidPrices,
  getValidTrendIndicators,
} from "../src/utils/market.js";

test("market summary keeps currencies in separate ranges", () => {
  const summary = getMarketSummary([
    {
      marketplace: "TCGplayer",
      currency: "USD",
      prices: [
        { label: "market", value: 12 },
        { label: "low", value: 8 },
      ],
    },
    {
      marketplace: "Cardmarket",
      currency: "EUR",
      prices: [
        { label: "trend", value: 9 },
        { label: "low", value: 7 },
      ],
    },
  ]);

  assert.equal(summary.hasPrices, true);
  assert.deepEqual(
    summary.currencyGroups.map((group) => group.currency),
    ["EUR", "USD"]
  );

  const euro = summary.currencyGroups[0];
  const usd = summary.currencyGroups[1];

  assert.equal(euro.lowest.numericValue, 7);
  assert.equal(euro.highest.numericValue, 9);
  assert.equal(usd.lowest.numericValue, 8);
  assert.equal(usd.highest.numericValue, 12);
});

test("invalid price and indicator values are excluded", () => {
  assert.deepEqual(
    getValidPrices({
      prices: [
        { label: "missing", value: null },
        { label: "empty", value: "" },
        { label: "invalid", value: "not-a-price" },
        { label: "market", value: "15.50" },
      ],
    }).map((price) => price.numericValue),
    [15.5]
  );

  assert.deepEqual(
    getValidTrendIndicators({
      priceHistory: [
        { label: "30-day avg", value: 11 },
        { label: "missing", value: undefined },
      ],
    }).map((point) => point.numericValue),
    [11]
  );
});
