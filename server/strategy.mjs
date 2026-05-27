const SPOT_BASE_URL = "https://api.binance.com";
const FUTURES_BASE_URL = "https://fapi.binance.com";
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const params = new URLSearchParams({
    symbol,
    startTime: String(startTime),
    endTime: String(endTime),
    limit: "1000",
  });
  const rows = await fetchJson(`${FUTURES_BASE_URL}/fapi/v1/fundingRate?${params.toString()}`);

  return rows.map((row) => ({
    fundingTime: row.fundingTime,
    fundingRate: toNumber(row.fundingRate),
  }));
}

const pnlToResult = ({ pnl, principal, days }) => ({
  pnl,
  periodReturnPct: principal > 0 ? pnl / principal : 0,
  annualizedApr: principal > 0 ? (pnl / principal) * (365 / days) : 0,
});

const summarizeFunding = (fundingRates, shortNotional) => {
  const fundingPnl = fundingRates.reduce((sum, row) => sum + shortNotional * row.fundingRate, 0);
  const averageFundingRate = fundingRates.length > 0
    ? fundingRates.reduce((sum, row) => sum + row.fundingRate, 0) / fundingRates.length
    : 0;

  return {
    count: fundingRates.length,
    fundingPnl,
    averageFundingRate,
    annualizedFundingPct: averageFundingRate * 3 * 365,
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

export async function runStrategyBacktest(params) {
  const symbol = String(params.symbol ?? "TRXUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const requestedDays = clamp(Math.round(toNumber(params.days, 30)), 1, 180);
  const principal = Math.max(toNumber(params.principal, 10000), 1);
  const earnApr = normalizeRate(params.earnApr ?? 0.12);
  const hedgeRatio = clamp(normalizeRate(params.hedgeRatio ?? 1), 0, 2);
  const spotFeeRate = Math.max(toNumber(params.spotFeeBps, 10), 0) / 10000;
  const futuresFeeRate = Math.max(toNumber(params.futuresFeeBps, 5), 0) / 10000;
  const slippageRate = Math.max(toNumber(params.slippageBps, 2), 0) / 10000;
  const interval = requestedDays <= 7 ? "1h" : "1d";
  const endTime = Date.now();
  const startTime = endTime - requestedDays * DAY_MS;

  const [spotKlines, futuresKlines, fundingRates] = await Promise.all([
    fetchKlines({ market: "spot", symbol, startTime, endTime, interval }),
    fetchKlines({ market: "futures", symbol, startTime, endTime, interval }),
    fetchFundingRates({ symbol, startTime, endTime }),
  ]);

  if (spotKlines.length < 2 || futuresKlines.length < 2) {
    throw new Error("Not enough historical candles for this symbol");
  }

  const firstSpot = spotKlines[0];
  const lastSpot = spotKlines[spotKlines.length - 1];
  const firstFutures = futuresKlines[0];
  const lastFutures = futuresKlines[futuresKlines.length - 1];
  const actualDays = Math.max((lastSpot.closeTime - firstSpot.openTime) / DAY_MS, 1);
  const spotQty = principal / firstSpot.close;
  const shortNotional = principal * hedgeRatio;
  const futuresQty = firstFutures.close > 0 ? shortNotional / firstFutures.close : 0;
  const exitSpotValue = spotQty * lastSpot.close;
  const exitFuturesNotional = futuresQty * lastFutures.close;
  const earnPnl = principal * earnApr * (actualDays / 365);
  const spotPricePnl = exitSpotValue - principal;
  const shortPricePnl = (firstFutures.close - lastFutures.close) * futuresQty;
  const funding = summarizeFunding(fundingRates, shortNotional);
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
  const series = spotKlines.map((spotCandle) => {
    const futuresCandle = nearestFutureCandle(futuresKlines, spotCandle.openTime);
    while (fundingRates[fundingIndex] && fundingRates[fundingIndex].fundingTime <= spotCandle.closeTime) {
      cumulativeFunding += shortNotional * fundingRates[fundingIndex].fundingRate;
      fundingIndex += 1;
    }

    const elapsedDays = Math.max((spotCandle.closeTime - firstSpot.openTime) / DAY_MS, 0);
    const currentSpotValue = spotQty * spotCandle.close;
    const currentFuturesNotional = futuresQty * futuresCandle.close;
    const currentEarnPnl = principal * earnApr * (elapsedDays / 365);
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
      principal,
      earnApr,
      hedgeRatio,
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
    },
    results: {
      earnOnly: pnlToResult({ pnl: earnOnlyPnl, principal, days: actualDays }),
      shortOnly: pnlToResult({ pnl: shortOnlyPnl, principal, days: actualDays }),
      earnPlusShort: pnlToResult({ pnl: combinedPnl, principal, days: actualDays }),
    },
    series,
  };
}
