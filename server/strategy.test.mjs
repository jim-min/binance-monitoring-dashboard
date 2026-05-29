import assert from "node:assert/strict";
import test from "node:test";
import { calculateStrategyBacktest } from "./strategy.mjs";

const day = 24 * 60 * 60 * 1000;
const candle = (index, close) => ({
  openTime: index * day,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1000,
  closeTime: (index + 1) * day,
});

const assertAlmostEqual = (actual, expected, epsilon = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
};

test("calculateStrategyBacktest combines earn, short, funding, fee, and slippage components", () => {
  const result = calculateStrategyBacktest({
    symbol: "ABCUSDT",
    requestedDays: 2,
    principal: 1000,
    earnApr: 0.365,
    hedgeRatio: 1,
    spotFeeRate: 0.001,
    futuresFeeRate: 0.0005,
    slippageRate: 0,
    interval: "1d",
    spotKlines: [candle(0, 10), candle(1, 12)],
    futuresKlines: [candle(0, 10), candle(1, 9)],
    fundingRates: [
      { fundingTime: day / 2, fundingRate: 0.0001 },
      { fundingTime: day + day / 2, fundingRate: -0.0002 },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.symbol, "ABCUSDT");
  assert.equal(result.assumptions.actualDays, 2);
  assertAlmostEqual(result.market.spotMovePct, 0.2);
  assert.equal(result.funding.count, 2);
  assert.equal(result.components.earnPnl, 2);
  assert.equal(result.components.spotPricePnl, 200);
  assert.equal(result.components.shortPricePnl, 100);
  assertAlmostEqual(result.components.fundingPnl, -0.1);
  assert.equal(result.components.spotFees, 2.2);
  assert.equal(result.components.futuresFees, 0.95);
  assertAlmostEqual(result.results.earnPlusShort.pnl, 298.75);
  assert.equal(result.series.length, 2);
});

test("calculateStrategyBacktest rejects insufficient candle data", () => {
  assert.throws(() => calculateStrategyBacktest({
    spotKlines: [candle(0, 10)],
    futuresKlines: [candle(0, 10), candle(1, 10)],
    fundingRates: [],
  }), /Not enough historical candles/);
});
