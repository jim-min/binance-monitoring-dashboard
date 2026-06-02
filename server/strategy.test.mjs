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
    futuresLeverage: 2,
    spotFeeRate: 0.001,
    futuresFeeRate: 0.0005,
    slippageRate: 0,
    interval: "1d",
    spotKlines: [candle(0, 10), candle(1, 12)],
    futuresKlines: [candle(0, 10), candle(1, 9)],
    fundingRates: [
      { fundingTime: day / 2, fundingRate: 0.0001, markPrice: 10 },
      { fundingTime: day + day / 2, fundingRate: -0.0002, markPrice: 9 },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.symbol, "ABCUSDT");
  assert.equal(result.assumptions.actualDays, 2);
  assertAlmostEqual(result.market.spotMovePct, 0.2);
  assert.equal(result.funding.count, 2);
  assert.equal(result.assumptions.shortNotional, 1000);
  assert.equal(result.assumptions.futuresMargin, 500);
  assert.equal(result.assumptions.totalRequiredCapital, 1500);
  assert.equal(result.assumptions.grossNotional, 2000);
  assertAlmostEqual(result.components.earnPnl, 2.4);
  assert.equal(result.components.spotPricePnl, 200);
  assert.equal(result.components.shortPricePnl, 100);
  assertAlmostEqual(result.components.fundingPnl, -0.08);
  assert.equal(result.components.spotFees, 2.2);
  assert.equal(result.components.futuresFees, 0.95);
  assertAlmostEqual(result.results.earnPlusShort.pnl, 299.17);
  assertAlmostEqual(result.results.earnPlusShort.periodReturnPct, 0.29917);
  assertAlmostEqual(result.results.earnPlusShort.capitalReturnPct, 299.17 / 1500);
  assertAlmostEqual(result.results.earnPlusShort.grossReturnPct, 299.17 / 2000);
  assert.equal(result.series.length, 2);
});

test("calculateStrategyBacktest uses time-varying Earn APR history when available", () => {
  const result = calculateStrategyBacktest({
    symbol: "ABCUSDT",
    requestedDays: 2,
    principal: 1000,
    earnApr: 0.1,
    spotFeeRate: 0,
    futuresFeeRate: 0,
    slippageRate: 0,
    interval: "1d",
    spotKlines: [candle(0, 10), candle(1, 10)],
    futuresKlines: [candle(0, 10), candle(1, 10)],
    fundingRates: [],
    earnRateHistory: [
      { time: 0, annualPercentageRate: 0.365 },
      { time: day, annualPercentageRate: 0.73 },
    ],
    earnHistorySource: "history",
    earnProductId: "ABC001",
  });

  assert.equal(result.earn.source, "history");
  assert.equal(result.earn.productId, "ABC001");
  assert.equal(result.earn.records, 2);
  assertAlmostEqual(result.earn.averageApr, 0.5475);
  assertAlmostEqual(result.components.earnPnl, 3);
  assertAlmostEqual(result.series[0].earnApr, 0.365);
  assertAlmostEqual(result.series[1].earnApr, 0.73);
});

test("calculateStrategyBacktest rejects insufficient candle data", () => {
  assert.throws(() => calculateStrategyBacktest({
    spotKlines: [candle(0, 10)],
    futuresKlines: [candle(0, 10), candle(1, 10)],
    fundingRates: [],
  }), /Not enough historical candles/);
});
