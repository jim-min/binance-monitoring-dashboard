import crypto from "node:crypto";
import { env } from "./env.mjs";

const BINANCE_BASE_URL = "https://api.binance.com";

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
