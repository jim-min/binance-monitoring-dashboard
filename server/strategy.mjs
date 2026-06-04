const SPOT_BASE_URL = "https://api.binance.com";
const FUTURES_BASE_URL = "https://fapi.binance.com";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BACKTEST_DAYS = 365;
const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

import { fetchFlexibleEarnProducts, signedBinanceRequest } from "./binance.mjs";
import { fetchEarningEvents, isAprEvent, loadStoredEarnEventPeriods, parseEventPeriodText } from "./earningEvents.mjs";

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeRate = (value) => {
  const number = toNumber(value);
  return Math.abs(number) > 1 ? number / 100 : number;
};

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.msg ?? data?.message ?? `Binance request failed with ${response.status}`;
    throw new Error(message);
  }

  return data;
}

const historyCache = new Map();

const getCached = async (key, factory) => {
  const now = Date.now();
  const cached = historyCache.get(key);
  if (cached && now - cached.cachedAt < HISTORY_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = await factory();
  historyCache.set(key, { cachedAt: now, value });
  return value;
};

async function fetchKlines({ market, symbol, startTime, endTime, interval }) {
  const baseUrl = market === "futures" ? FUTURES_BASE_URL : SPOT_BASE_URL;
  const path = market === "futures" ? "/fapi/v1/klines" : "/api/v3/klines";
  const params = new URLSearchParams({
    symbol,
    interval,
    startTime: String(startTime),
    endTime: String(endTime),
    limit: "1000",
  });
  const rows = await fetchJson(`${baseUrl}${path}?${params.toString()}`);

  return rows.map((row) => ({
    openTime: row[0],
    open: toNumber(row[1]),
    high: toNumber(row[2]),
    low: toNumber(row[3]),
    close: toNumber(row[4]),
    volume: toNumber(row[5]),
    closeTime: row[6],
  }));
}

async function fetchFundingRates({ symbol, startTime, endTime }) {
  const rows = [];
  let cursor = startTime;

  while (cursor <= endTime) {
    const params = new URLSearchParams({
      symbol,
      startTime: String(cursor),
      endTime: String(endTime),
      limit: "1000",
    });
    const page = await fetchJson(`${FUTURES_BASE_URL}/fapi/v1/fundingRate?${params.toString()}`);
    rows.push(...page);

    if (!Array.isArray(page) || page.length < 1000) {
      break;
    }

    const last = page[page.length - 1];
    cursor = Number(last.fundingTime) + 1;
  }

  return rows.map((row) => ({
    fundingTime: row.fundingTime,
    fundingRate: toNumber(row.fundingRate),
    markPrice: toNumber(row.markPrice),
  }));
}

async function fetchFlexibleEarnProduct(asset) {
  const products = await getCached("flexible-products", async () => {
    const result = await fetchFlexibleEarnProducts();
    if (!result.ok) {
      throw new Error(result.data?.msg ?? "Flexible Earn product fetch failed");
    }
    return Array.isArray(result.data.rows) ? result.data.rows : [];
  });
  const normalizedAsset = String(asset).toUpperCase();
  const matches = products.filter((row) => String(row.asset ?? "").toUpperCase() === normalizedAsset);

  return matches
    .sort((a, b) => {
      const purchaseScore = Number(Boolean(b.canPurchase && !b.isSoldOut)) - Number(Boolean(a.canPurchase && !a.isSoldOut));
      if (purchaseScore !== 0) {
        return purchaseScore;
      }
      return toNumber(b.latestAnnualPercentageRate) - toNumber(a.latestAnnualPercentageRate);
    })[0] ?? null;
}

const parseTierRange = (range, rate) => {
  const normalizedRange = String(range ?? "").replace(/\s+/g, "");
  const match = normalizedRange.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)([A-Z0-9]+)$/i);

  if (!match) {
    return null;
  }

  return {
    range: String(range),
    fromQty: toNumber(match[1]),
    toQty: toNumber(match[2]),
    asset: match[3].toUpperCase(),
    apr: normalizeRate(rate),
  };
};

const parseBonusTiers = (product, asset) => {
  const tiers = product?.tierAnnualPercentageRate && typeof product.tierAnnualPercentageRate === "object"
    ? Object.entries(product.tierAnnualPercentageRate)
    : [];
  const normalizedAsset = String(asset ?? "").toUpperCase();

  return tiers
    .map(([range, rate]) => parseTierRange(range, rate))
    .filter((tier) => tier && tier.asset === normalizedAsset && tier.toQty > tier.fromQty && tier.apr > 0)
    .sort((a, b) => a.fromQty - b.fromQty);
};

const safeFetchEarnBonusEvents = async (asset) => {
  try {
    return await getCached(`earn-bonus-events:${asset}`, () => fetchEarnBonusEvents(asset));
  } catch {
    return [];
  }
};

const parseEventPeriod = (text) => {
  return parseEventPeriodText(text);
};

async function fetchEarnBonusEvents(asset) {
  const normalizedAsset = String(asset ?? "").toUpperCase();
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => fetchEarningEvents({
    pageNo: String(index + 1),
    pageSize: "20",
    detailSize: "20",
  })));

  const fetched = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .flatMap((result) => result.data.rows)
    .filter(isAprEvent)
    .filter((event) => event.assets?.some((eventAsset) => String(eventAsset).toUpperCase() === normalizedAsset))
    .flatMap((event) => {
      const periods = Array.isArray(event.periods) ? event.periods : [];
      return periods
        .map(parseEventPeriod)
        .filter(Boolean)
        .map((period) => ({
          ...period,
          title: event.title,
          code: event.code,
          url: event.url,
        }));
    })
    .sort((a, b) => a.startTime - b.startTime);
  const stored = loadStoredEarnEventPeriods(asset);

  return [...new Map([...stored, ...fetched].map((event) => [
    `${event.code}:${event.startTime}:${event.endTime}`,
    event,
  ])).values()].sort((a, b) => a.startTime - b.startTime);
}

async function fetchEarnRateHistory({ asset, startTime, endTime }) {
  try {
    const product = await fetchFlexibleEarnProduct(asset);
    if (!product?.productId) {
      return {
        source: "unavailable",
        asset,
        productId: null,
        rows: [],
        error: "Flexible Earn product was not found for this asset",
        bonusTiers: [],
        bonusEvents: [],
      };
    }

    const rows = [];
    let current = 1;
    while (current <= 10) {
      const result = await signedBinanceRequest("/sapi/v1/simple-earn/flexible/history/rateHistory", {
        productId: product.productId,
        aprPeriod: "DAY",
        startTime: String(startTime),
        endTime: String(endTime),
        current: String(current),
        size: "100",
      });

      if (!result.ok) {
        return {
          source: "unavailable",
          asset,
          productId: product.productId,
          rows: [],
          error: result.data?.msg ?? "Flexible Earn rate history fetch failed",
          bonusTiers: parseBonusTiers(product, asset),
          bonusEvents: [],
        };
      }

      const pageRows = Array.isArray(result.data.rows) ? result.data.rows : [];
      rows.push(...pageRows.map((row) => ({
        productId: row.productId ?? product.productId,
        asset: row.asset ?? asset,
        annualPercentageRate: normalizeRate(row.annualPercentageRate),
        time: Number(row.time),
      })).filter((row) => Number.isFinite(row.time)));

      const total = Number(result.data.total ?? rows.length);
      if (pageRows.length < 100 || rows.length >= total) {
        break;
      }
      current += 1;
    }

    return {
      source: rows.length > 0 ? "history" : "unavailable",
      asset,
      productId: product.productId,
      rows: rows.sort((a, b) => a.time - b.time),
      error: rows.length > 0 ? null : "Flexible Earn rate history returned no rows",
      bonusTiers: parseBonusTiers(product, asset),
      bonusEvents: await safeFetchEarnBonusEvents(asset),
    };
  } catch (error) {
    return {
      source: "unavailable",
      asset,
      productId: null,
      rows: [],
      error: error instanceof Error ? error.message : "Flexible Earn rate history fetch failed",
      bonusTiers: [],
      bonusEvents: [],
    };
  }
}

const pnlToResult = ({ pnl, principal, totalRequiredCapital, grossNotional, days }) => ({
  pnl,
  periodReturnPct: principal > 0 ? pnl / principal : 0,
  annualizedApr: principal > 0 ? (pnl / principal) * (365 / days) : 0,
  capitalReturnPct: totalRequiredCapital > 0 ? pnl / totalRequiredCapital : 0,
  capitalAnnualizedApr: totalRequiredCapital > 0 ? (pnl / totalRequiredCapital) * (365 / days) : 0,
  grossReturnPct: grossNotional > 0 ? pnl / grossNotional : 0,
});

const nearestCandle = (klines, time) => {
  let closest = klines[0];
  let closestDistance = Math.abs((closest?.openTime ?? 0) - time);

  for (const candle of klines) {
    const distance = Math.min(
      Math.abs(candle.openTime - time),
      Math.abs(candle.closeTime - time),
    );
    if (distance <= closestDistance) {
      closest = candle;
      closestDistance = distance;
    }
  }

  return closest;
};

const fundingNotional = (row, futuresKlines, futuresQty) => {
  if (Number.isFinite(row.markPrice) && row.markPrice > 0) {
    return futuresQty * row.markPrice;
  }
  return futuresQty * (nearestCandle(futuresKlines, row.fundingTime)?.close ?? 0);
};

const summarizeFunding = (fundingRates, futuresKlines, futuresQty) => {
  const fundingPnl = fundingRates.reduce((sum, row) => sum + fundingNotional(row, futuresKlines, futuresQty) * row.fundingRate, 0);
  const averageFundingRate = fundingRates.length > 0
    ? fundingRates.reduce((sum, row) => sum + row.fundingRate, 0) / fundingRates.length
    : 0;

  return {
    count: fundingRates.length,
    fundingPnl,
    averageFundingRate,
    annualizedFundingPct: averageFundingRate * 3 * 365,
    positiveCount: fundingRates.filter((row) => row.fundingRate > 0).length,
    negativeCount: fundingRates.filter((row) => row.fundingRate < 0).length,
  };
};

const nearestFutureCandle = (futuresKlines, openTime) => {
  let closest = futuresKlines[0];
  let closestDistance = Math.abs((closest?.openTime ?? 0) - openTime);

  for (const candle of futuresKlines) {
    const distance = Math.abs(candle.openTime - openTime);
    if (distance < closestDistance) {
      closest = candle;
      closestDistance = distance;
    }
  }

  return closest;
};

export function calculateStrategyBacktest({
  symbol = "TRXUSDT",
  requestedDays = 30,
  startTime,
  endTime,
  principal = 10000,
  earnApr = 0.12,
  earnRateHistory = [],
  earnHistorySource = "manual",
  earnProductId = null,
  earnHistoryError = null,
  earnBonusTiers = [],
  earnBonusEvents = [],
  futuresLeverage = 1,
  spotFeeRate = 0.001,
  futuresFeeRate = 0.0005,
  slippageRate = 0.0002,
  interval = "1d",
  spotKlines,
  futuresKlines,
  fundingRates,
}) {
  if (spotKlines.length < 2 || futuresKlines.length < 2) {
    throw new Error("Not enough historical candles for this symbol");
  }

  const firstSpot = spotKlines[0];
  const lastSpot = spotKlines[spotKlines.length - 1];
  const firstFutures = futuresKlines[0];
  const lastFutures = futuresKlines[futuresKlines.length - 1];
  const actualDays = Math.max((lastSpot.closeTime - firstSpot.openTime) / DAY_MS, 1);
  const spotQty = principal / firstSpot.close;
  const hedgeRatio = 1;
  const shortNotional = principal;
  const futuresMargin = futuresLeverage > 0 ? shortNotional / futuresLeverage : shortNotional;
  const totalRequiredCapital = principal + futuresMargin;
  const grossNotional = principal + shortNotional;
  const futuresQty = firstFutures.close > 0 ? shortNotional / firstFutures.close : 0;
  const exitSpotValue = spotQty * lastSpot.close;
  const exitFuturesNotional = futuresQty * lastFutures.close;
  const spotPricePnl = exitSpotValue - principal;
  const shortPricePnl = (firstFutures.close - lastFutures.close) * futuresQty;
  const funding = summarizeFunding(fundingRates, futuresKlines, futuresQty);
  const sortedEarnRates = earnRateHistory
    .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.annualPercentageRate))
    .sort((a, b) => a.time - b.time);
  const rateForTime = (time) => {
    if (sortedEarnRates.length === 0) {
      return earnApr;
    }

    let selected = sortedEarnRates[0];
    for (const row of sortedEarnRates) {
      if (row.time <= time) {
        selected = row;
      } else {
        break;
      }
    }
    return selected.annualPercentageRate;
  };
  const bonusCapitalTiers = earnBonusTiers.map((tier) => ({
    ...tier,
    fromCapital: tier.fromQty * firstSpot.close,
    toCapital: tier.toQty * firstSpot.close,
  }));
  const activeBonusEventsForTime = (time) => earnBonusEvents.filter((event) => event.startTime <= time && time <= event.endTime);
  const hasEventForTime = (time) => activeBonusEventsForTime(time).length > 0;
  const bonusAprCapitalForTime = (capital, time) => {
    if (!hasEventForTime(time) || bonusCapitalTiers.length === 0 || capital <= 0) {
      return 0;
    }

    return bonusCapitalTiers.reduce((sum, tier) => {
      const eligibleCapital = Math.max(Math.min(capital, tier.toCapital) - tier.fromCapital, 0);
      return sum + eligibleCapital * tier.apr;
    }, 0);
  };
  const maxBonusEligibleCapital = bonusCapitalTiers.reduce((sum, tier) => {
    const eligibleCapital = Math.max(Math.min(principal, tier.toCapital) - tier.fromCapital, 0);
    return sum + eligibleCapital;
  }, 0);
  const maxBonusCapCapital = bonusCapitalTiers.reduce((sum, tier) => sum + Math.max(tier.toCapital - tier.fromCapital, 0), 0);

  let earnedQty = 0;
  let baseEarnedQty = 0;
  let bonusEarnedQty = 0;
  let weightedAprDays = 0;
  let weightedBaseAprDays = 0;
  let weightedBonusAprDays = 0;
  let bonusAppliedDays = 0;
  let previousEarnTime = firstSpot.openTime;
  for (const spotCandle of spotKlines) {
    const intervalDays = Math.max((spotCandle.closeTime - previousEarnTime) / DAY_MS, 0);
    const baseApr = rateForTime(spotCandle.openTime);
    const bonusAprCapital = bonusAprCapitalForTime(principal, spotCandle.openTime);
    const intervalBaseEarnedQty = spotQty * baseApr * (intervalDays / 365);
    const intervalBonusEarnedQty = firstSpot.close > 0 ? (bonusAprCapital / firstSpot.close) * (intervalDays / 365) : 0;
    const effectiveBonusApr = principal > 0 ? bonusAprCapital / principal : 0;

    baseEarnedQty += intervalBaseEarnedQty;
    bonusEarnedQty += intervalBonusEarnedQty;
    earnedQty += intervalBaseEarnedQty + intervalBonusEarnedQty;
    weightedBaseAprDays += baseApr * intervalDays;
    weightedBonusAprDays += effectiveBonusApr * intervalDays;
    weightedAprDays += (baseApr + effectiveBonusApr) * intervalDays;
    if (effectiveBonusApr > 0) {
      bonusAppliedDays += intervalDays;
    }
    previousEarnTime = spotCandle.closeTime;
  }

  const earnPnl = earnedQty * lastSpot.close;
  const baseEarnPnl = baseEarnedQty * lastSpot.close;
  const bonusEarnPnl = bonusEarnedQty * lastSpot.close;
  const averageEarnApr = actualDays > 0 ? weightedAprDays / actualDays : earnApr;
  const averageBaseApr = actualDays > 0 ? weightedBaseAprDays / actualDays : earnApr;
  const averageBonusApr = actualDays > 0 ? weightedBonusAprDays / actualDays : 0;
  const spotFees = principal * spotFeeRate + exitSpotValue * spotFeeRate;
  const futuresFees = shortNotional * futuresFeeRate + exitFuturesNotional * futuresFeeRate;
  const spotSlippage = (principal + exitSpotValue) * slippageRate;
  const futuresSlippage = (shortNotional + exitFuturesNotional) * slippageRate;
  const earnOnlyPnl = earnPnl + spotPricePnl - spotFees - spotSlippage;
  const shortOnlyPnl = shortPricePnl + funding.fundingPnl - futuresFees - futuresSlippage;
  const combinedPnl = earnPnl + spotPricePnl + shortPricePnl + funding.fundingPnl
    - spotFees - futuresFees - spotSlippage - futuresSlippage;

  let cumulativeFunding = 0;
  let fundingIndex = 0;
  let cumulativeEarnedQty = 0;
  let cumulativeBaseEarnedQty = 0;
  let cumulativeBonusEarnedQty = 0;
  let previousSeriesEarnTime = firstSpot.openTime;
  const series = spotKlines.map((spotCandle) => {
    const futuresCandle = nearestFutureCandle(futuresKlines, spotCandle.openTime);
    while (fundingRates[fundingIndex] && fundingRates[fundingIndex].fundingTime <= spotCandle.closeTime) {
      cumulativeFunding += fundingNotional(fundingRates[fundingIndex], futuresKlines, futuresQty) * fundingRates[fundingIndex].fundingRate;
      fundingIndex += 1;
    }

    const intervalDays = Math.max((spotCandle.closeTime - previousSeriesEarnTime) / DAY_MS, 0);
    const currentBaseApr = rateForTime(spotCandle.openTime);
    const currentBonusAprCapital = bonusAprCapitalForTime(principal, spotCandle.openTime);
    const currentBonusApr = principal > 0 ? currentBonusAprCapital / principal : 0;
    cumulativeBaseEarnedQty += spotQty * currentBaseApr * (intervalDays / 365);
    cumulativeBonusEarnedQty += firstSpot.close > 0 ? (currentBonusAprCapital / firstSpot.close) * (intervalDays / 365) : 0;
    cumulativeEarnedQty = cumulativeBaseEarnedQty + cumulativeBonusEarnedQty;
    previousSeriesEarnTime = spotCandle.closeTime;
    const currentSpotValue = spotQty * spotCandle.close;
    const currentFuturesNotional = futuresQty * futuresCandle.close;
    const currentEarnPnl = cumulativeEarnedQty * spotCandle.close;
    const currentSpotPnl = currentSpotValue - principal;
    const currentShortPnl = (firstFutures.close - futuresCandle.close) * futuresQty;
    const currentSpotFees = principal * spotFeeRate + currentSpotValue * spotFeeRate;
    const currentFuturesFees = shortNotional * futuresFeeRate + currentFuturesNotional * futuresFeeRate;
    const currentSpotSlippage = (principal + currentSpotValue) * slippageRate;
    const currentFuturesSlippage = (shortNotional + currentFuturesNotional) * slippageRate;

    return {
      time: new Date(spotCandle.closeTime).toISOString(),
      spotClose: spotCandle.close,
      futuresClose: futuresCandle.close,
      earnApr: currentBaseApr + currentBonusApr,
      baseEarnApr: currentBaseApr,
      bonusEarnApr: currentBonusApr,
      fundingPnl: cumulativeFunding,
      earnOnlyPnl: currentEarnPnl + currentSpotPnl - currentSpotFees - currentSpotSlippage,
      shortOnlyPnl: currentShortPnl + cumulativeFunding - currentFuturesFees - currentFuturesSlippage,
      combinedPnl: currentEarnPnl + currentSpotPnl + currentShortPnl + cumulativeFunding
        - currentSpotFees - currentFuturesFees - currentSpotSlippage - currentFuturesSlippage,
    };
  });

  return {
    ok: true,
    symbol,
    generatedAt: new Date().toISOString(),
    assumptions: {
      requestedDays,
      actualDays,
      startTime: startTime ?? firstSpot.openTime,
      endTime: endTime ?? lastSpot.closeTime,
      principal,
      earnApr,
      hedgeRatio,
      futuresLeverage,
      shortNotional,
      futuresMargin,
      totalRequiredCapital,
      grossNotional,
      spotFeeBps: spotFeeRate * 10000,
      futuresFeeBps: futuresFeeRate * 10000,
      slippageBps: slippageRate * 10000,
      interval,
    },
    market: {
      entrySpot: firstSpot.close,
      exitSpot: lastSpot.close,
      entryFutures: firstFutures.close,
      exitFutures: lastFutures.close,
      spotMovePct: firstSpot.close > 0 ? lastSpot.close / firstSpot.close - 1 : 0,
      futuresMovePct: firstFutures.close > 0 ? lastFutures.close / firstFutures.close - 1 : 0,
    },
    components: {
      earnPnl,
      baseEarnPnl,
      bonusEarnPnl,
      spotPricePnl,
      shortPricePnl,
      fundingPnl: funding.fundingPnl,
      spotFees,
      futuresFees,
      spotSlippage,
      futuresSlippage,
    },
    funding: {
      count: funding.count,
      averageFundingRate: funding.averageFundingRate,
      annualizedFundingPct: funding.annualizedFundingPct,
      positiveCount: funding.positiveCount,
      negativeCount: funding.negativeCount,
    },
    earn: {
      source: sortedEarnRates.length > 0 ? earnHistorySource : "manual",
      productId: earnProductId,
      records: sortedEarnRates.length,
      averageApr: averageEarnApr,
      averageBaseApr,
      averageBonusApr,
      fallbackApr: earnApr,
      latestApr: sortedEarnRates.at(-1)?.annualPercentageRate ?? earnApr,
      bonusTiers: earnBonusTiers,
      bonusCapitalTiers,
      bonusEvents: earnBonusEvents,
      bonusAppliedDays,
      bonusEligibleCapital: maxBonusEligibleCapital,
      bonusCapCapital: maxBonusCapCapital,
      error: sortedEarnRates.length > 0 ? null : earnHistoryError,
    },
    results: {
      earnOnly: pnlToResult({
        pnl: earnOnlyPnl,
        principal,
        totalRequiredCapital: principal,
        grossNotional: principal,
        days: actualDays,
      }),
      shortOnly: pnlToResult({
        pnl: shortOnlyPnl,
        principal: futuresMargin,
        totalRequiredCapital: futuresMargin,
        grossNotional: shortNotional,
        days: actualDays,
      }),
      earnPlusShort: pnlToResult({
        pnl: combinedPnl,
        principal,
        totalRequiredCapital,
        grossNotional,
        days: actualDays,
      }),
    },
    series,
  };
}

export async function runStrategyBacktest(params) {
  const symbol = String(params.symbol ?? "TRXUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const now = Date.now();
  const requestedDays = clamp(Math.round(toNumber(params.days, 30)), 1, MAX_BACKTEST_DAYS);
  const parsedStartTime = Number(params.startTime);
  const parsedEndTime = Number(params.endTime);
  const hasDateRange = Number.isFinite(parsedStartTime) && Number.isFinite(parsedEndTime) && parsedEndTime > parsedStartTime;
  const endTime = hasDateRange ? parsedEndTime : now;
  const startTime = hasDateRange ? parsedStartTime : endTime - requestedDays * DAY_MS;
  const boundedStartTime = Math.max(startTime, endTime - MAX_BACKTEST_DAYS * DAY_MS);
  const actualRequestedDays = Math.max(Math.round((endTime - boundedStartTime) / DAY_MS), 1);
  const principal = Math.max(toNumber(params.principal, 10000), 1);
  const earnApr = normalizeRate(params.earnApr ?? 0.12);
  const futuresLeverage = clamp(toNumber(params.futuresLeverage, 1), 1, 20);
  const spotFeeRate = Math.max(toNumber(params.spotFeeBps, 10), 0) / 10000;
  const futuresFeeRate = Math.max(toNumber(params.futuresFeeBps, 5), 0) / 10000;
  const slippageRate = Math.max(toNumber(params.slippageBps, 2), 0) / 10000;
  const interval = actualRequestedDays <= 7 ? "1h" : "1d";
  const asset = symbol.endsWith("USDT") ? symbol.slice(0, -4) : symbol;

  const [spotKlines, futuresKlines, fundingRates, earnHistory] = await Promise.all([
    getCached(`spot:${symbol}:${boundedStartTime}:${endTime}:${interval}`, () => fetchKlines({ market: "spot", symbol, startTime: boundedStartTime, endTime, interval })),
    getCached(`futures:${symbol}:${boundedStartTime}:${endTime}:${interval}`, () => fetchKlines({ market: "futures", symbol, startTime: boundedStartTime, endTime, interval })),
    getCached(`funding:${symbol}:${boundedStartTime}:${endTime}`, () => fetchFundingRates({ symbol, startTime: boundedStartTime, endTime })),
    getCached(`earn:${asset}:${boundedStartTime}:${endTime}`, () => fetchEarnRateHistory({ asset, startTime: boundedStartTime, endTime })),
  ]);

  if (spotKlines.length < 2 || futuresKlines.length < 2) {
    throw new Error("Not enough historical candles for this symbol");
  }

  return calculateStrategyBacktest({
    symbol,
    requestedDays: actualRequestedDays,
    startTime: boundedStartTime,
    endTime,
    principal,
    earnApr,
    earnRateHistory: earnHistory.rows,
    earnHistorySource: earnHistory.source,
    earnProductId: earnHistory.productId,
    earnHistoryError: earnHistory.error,
    earnBonusTiers: earnHistory.bonusTiers,
    earnBonusEvents: earnHistory.bonusEvents,
    futuresLeverage,
    spotFeeRate,
    futuresFeeRate,
    slippageRate,
    interval,
    spotKlines,
    futuresKlines,
    fundingRates,
  });
}
