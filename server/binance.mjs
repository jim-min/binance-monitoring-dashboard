import crypto from "node:crypto";
import { env } from "./env.mjs";

const BINANCE_BASE_URL = "https://api.binance.com";
const BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com";

const signQuery = (params) => {
  const search = new URLSearchParams({
    ...params,
    timestamp: String(Date.now()),
    recvWindow: "5000",
  });
  const signature = crypto.createHmac("sha256", env.binanceApiSecret).update(search.toString()).digest("hex");
  search.set("signature", signature);
  return search;
};

export async function signedBinanceRequest(path, params = {}) {
  if (!env.binanceApiKey || !env.binanceApiSecret) {
    return {
      ok: false,
      status: 400,
      data: {
        code: "MISSING_BINANCE_KEYS",
        msg: "BINANCE_API_KEY and BINANCE_API_SECRET are required",
      },
    };
  }

  const query = signQuery(params);
  const response = await fetch(`${BINANCE_BASE_URL}${path}?${query.toString()}`, {
    headers: {
      "X-MBX-APIKEY": env.binanceApiKey,
    },
  });
  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function fetchFlexibleEarnProducts() {
  return fetchPaginatedEarnProducts("/sapi/v1/simple-earn/flexible/list", "FLEXIBLE");
}

export async function fetchLockedEarnProducts() {
  return fetchPaginatedEarnProducts("/sapi/v1/simple-earn/locked/list", "LOCKED");
}

async function fetchPaginatedEarnProducts(path, productType) {
  const size = 100;
  const maxPages = 10;
  const rows = [];
  let total = 0;

  for (let current = 1; current <= maxPages; current += 1) {
    const result = await signedBinanceRequest(path, {
      current: String(current),
      size: String(size),
    });

    if (!result.ok) {
      return result;
    }

    total = Number(result.data.total ?? total);
    const pageRows = Array.isArray(result.data.rows) ? result.data.rows : [];
    rows.push(...pageRows.map((row) => ({ ...row, productType })));

    if (pageRows.length < size || rows.length >= total) {
      break;
    }
  }

  return {
    ok: true,
    status: 200,
    data: {
      total,
      rows,
      fetched: rows.length,
    },
  };
}

export async function fetchAllSimpleEarnProducts() {
  const [flexible, locked] = await Promise.all([
    fetchFlexibleEarnProducts(),
    fetchLockedEarnProducts(),
  ]);

  if (!flexible.ok) {
    return flexible;
  }

  if (!locked.ok) {
    return locked;
  }

  const rows = [...flexible.data.rows, ...locked.data.rows];

  return {
    ok: true,
    status: 200,
    data: {
      total: rows.length,
      fetched: rows.length,
      flexibleTotal: flexible.data.total,
      lockedTotal: locked.data.total,
      flexibleFetched: flexible.data.fetched,
      lockedFetched: locked.data.fetched,
      rows,
    },
  };
}

async function publicBinanceRequest(baseUrl, path, params = {}) {
  const query = new URLSearchParams(params);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(`${baseUrl}${path}${suffix}`);
  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function fetchFuturesExchangeInfo() {
  return publicBinanceRequest(BINANCE_FUTURES_BASE_URL, "/fapi/v1/exchangeInfo");
}

export async function fetchSpotExchangeInfo() {
  return publicBinanceRequest(BINANCE_BASE_URL, "/api/v3/exchangeInfo");
}

export async function fetchAccountPortfolio() {
  const [account, simpleEarn, tickerPrices] = await Promise.all([
    signedBinanceRequest("/api/v3/account"),
    signedBinanceRequest("/sapi/v1/simple-earn/account"),
    publicBinanceRequest(BINANCE_BASE_URL, "/api/v3/ticker/price"),
  ]);

  if (!account.ok) {
    return account;
  }

  const prices = new Map();
  if (tickerPrices.ok && Array.isArray(tickerPrices.data)) {
    for (const row of tickerPrices.data) {
      prices.set(row.symbol, Number(row.price));
    }
  }

  const estimateUsdtValue = (asset, amount) => {
    if (asset === "USDT") {
      return amount;
    }
    if (asset === "USDC" || asset === "FDUSD" || asset === "TUSD") {
      return amount;
    }
    const direct = prices.get(`${asset}USDT`);
    if (Number.isFinite(direct)) {
      return amount * direct;
    }
    const btcPrice = prices.get("BTCUSDT");
    const btcPair = prices.get(`${asset}BTC`);
    if (Number.isFinite(btcPrice) && Number.isFinite(btcPair)) {
      return amount * btcPair * btcPrice;
    }
    return 0;
  };

  const balances = (Array.isArray(account.data.balances) ? account.data.balances : [])
    .map((balance) => {
      const free = Number(balance.free ?? 0);
      const locked = Number(balance.locked ?? 0);
      const total = free + locked;
      return {
        asset: balance.asset,
        free,
        locked,
        total,
        usdtValue: estimateUsdtValue(balance.asset, total),
      };
    })
    .filter((balance) => balance.total > 0)
    .sort((a, b) => b.usdtValue - a.usdtValue);

  const spotUsdtValue = balances.reduce((sum, balance) => sum + balance.usdtValue, 0);
  const simpleEarnSummary = simpleEarn.ok ? {
    totalAmountInBTC: Number(simpleEarn.data.totalAmountInBTC ?? 0),
    totalAmountInUSDT: Number(simpleEarn.data.totalAmountInUSDT ?? 0),
    totalFlexibleAmountInBTC: Number(simpleEarn.data.totalFlexibleAmountInBTC ?? 0),
    totalFlexibleAmountInUSDT: Number(simpleEarn.data.totalFlexibleAmountInUSDT ?? 0),
    totalLockedInBTC: Number(simpleEarn.data.totalLockedInBTC ?? 0),
    totalLockedInUSDT: Number(simpleEarn.data.totalLockedInUSDT ?? 0),
  } : null;

  return {
    ok: true,
    status: 200,
    data: {
      accountType: account.data.accountType,
      canTrade: account.data.canTrade,
      canWithdraw: account.data.canWithdraw,
      canDeposit: account.data.canDeposit,
      updateTime: account.data.updateTime,
      permissions: account.data.permissions ?? [],
      balances,
      totals: {
        spotUsdtValue,
        simpleEarnUsdtValue: simpleEarnSummary?.totalAmountInUSDT ?? 0,
        combinedUsdtValue: spotUsdtValue + (simpleEarnSummary?.totalAmountInUSDT ?? 0),
      },
      simpleEarn: {
        ok: simpleEarn.ok,
        status: simpleEarn.status,
        error: simpleEarn.ok ? null : simpleEarn.data,
        summary: simpleEarnSummary,
      },
      pricedAt: new Date().toISOString(),
    },
  };
}

const earnAsset = (row) => {
  if (row.productType === "LOCKED") {
    return row.detail?.asset;
  }
  return row.asset;
};

const earnApr = (row) => {
  if (row.productType === "LOCKED") {
    return Number(row.detail?.apr ?? 0);
  }
  return Number(row.latestAnnualPercentageRate ?? 0);
};

export async function fetchEarnFuturesUniverse() {
  const [earnProducts, futuresInfo, spotInfo] = await Promise.all([
    fetchAllSimpleEarnProducts(),
    fetchFuturesExchangeInfo(),
    fetchSpotExchangeInfo(),
  ]);

  if (!earnProducts.ok) {
    return earnProducts;
  }

  if (!futuresInfo.ok) {
    return futuresInfo;
  }

  if (!spotInfo.ok) {
    return spotInfo;
  }

  const earnByAsset = new Map();
  for (const row of earnProducts.data.rows) {
    const asset = earnAsset(row);
    if (!asset) {
      continue;
    }

    const normalizedAsset = String(asset).toUpperCase();
    const current = earnByAsset.get(normalizedAsset) ?? {
      asset: normalizedAsset,
      productCount: 0,
      maxApr: 0,
      hasFlexible: false,
      hasLocked: false,
      canPurchase: false,
    };

    current.productCount += 1;
    current.maxApr = Math.max(current.maxApr, earnApr(row));
    current.hasFlexible ||= row.productType === "FLEXIBLE";
    current.hasLocked ||= row.productType === "LOCKED";
    current.canPurchase ||= row.productType === "LOCKED"
      ? row.detail?.status === "PURCHASING" && !row.detail?.isSoldOut
      : row.canPurchase && !row.isSoldOut;

    earnByAsset.set(normalizedAsset, current);
  }

  const futuresSymbols = Array.isArray(futuresInfo.data.symbols) ? futuresInfo.data.symbols : [];
  const spotSymbols = Array.isArray(spotInfo.data.symbols) ? spotInfo.data.symbols : [];
  const spotUsdtSymbols = new Set(spotSymbols
    .filter((symbol) => symbol.quoteAsset === "USDT" && symbol.status === "TRADING")
    .map((symbol) => symbol.symbol));
  const rows = futuresSymbols
    .filter((symbol) => (
      symbol.contractType === "PERPETUAL"
      && symbol.quoteAsset === "USDT"
      && symbol.status === "TRADING"
      && spotUsdtSymbols.has(symbol.symbol)
      && earnByAsset.has(symbol.baseAsset)
    ))
    .map((symbol) => ({
      asset: symbol.baseAsset,
      symbol: symbol.symbol,
      quoteAsset: symbol.quoteAsset,
      marginAsset: symbol.marginAsset,
      ...earnByAsset.get(symbol.baseAsset),
    }))
    .sort((a, b) => a.asset.localeCompare(b.asset));

  return {
    ok: true,
    status: 200,
    data: {
      total: rows.length,
      earnAssets: earnByAsset.size,
      futuresSymbols: futuresSymbols.length,
      spotSymbols: spotSymbols.length,
      rows,
    },
  };
}
