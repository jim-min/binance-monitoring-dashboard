const BINANCE_WEB_BASE_URL = "https://www.binance.com";
const ACTIVITY_CATALOG_ID = "93";
const CACHE_TTL_MS = 5 * 60 * 1000;

const eventCache = new Map();

async function fetchBinanceCms(path, params = {}) {
  const query = new URLSearchParams(params);
  const url = `${BINANCE_WEB_BASE_URL}${path}?${query.toString()}`;
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent": "Mozilla/5.0 BinanceMonitoringDashboard/0.1",
      },
    });
    const text = await response.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      lastError = new Error(`Binance CMS returned non-JSON response: ${text.slice(0, 120) || "empty response"}`);
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      continue;
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message ?? data.messageDetail ?? `Binance CMS request failed with ${response.status}`);
    }

    return data.data;
  }

  throw lastError ?? new Error("Binance CMS request failed");
}

const unique = (values) => [...new Set(values.filter(Boolean))];
const IGNORED_ASSETS = new Set(["UTC", "EST", "PST", "CET", "KGS", "USD", "EUR"]);

const normalizeSpaces = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizePageSize = (value) => {
  const size = Number(value) || 20;
  if (size <= 5) {
    return 5;
  }
  if (size <= 10) {
    return 10;
  }
  return 20;
};

function collectBodyText(node) {
  if (!node || typeof node !== "object") {
    return "";
  }

  const chunks = [];
  const visit = (item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    if (typeof item.text === "string") {
      chunks.push(item.text);
    }

    if (typeof item.content === "string") {
      chunks.push(item.content);
    }

    if (item.config) {
      visit(item.config);
    }

    if (Array.isArray(item.child)) {
      item.child.forEach(visit);
    }

    if (Array.isArray(item.content)) {
      item.content.forEach(visit);
    }

    if (item.hash && typeof item.hash === "object") {
      Object.values(item.hash).forEach(visit);
    }
  };

  visit(node);
  return normalizeSpaces(chunks.join(" "));
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractSignals(text) {
  const normalized = normalizeSpaces(text);
  const pairs = unique([...normalized.matchAll(/\b([A-Z0-9]{2,20}\/(?:USDT|USDC|FDUSD|BTC|BNB|ETH|TRY|EUR))\b/g)].map((match) => match[1]));
  const pairAssets = pairs.map((pair) => pair.split("/")[0]);
  const parenthesisAssets = [...normalized.matchAll(/\(([A-Z0-9]{2,15})\)/g)].map((match) => match[1]);
  const productAssets = [
    ...normalized.matchAll(/\b(?:with|on|to)\s+([A-Z0-9]{1,15})\s+(?:Flexible|Locked|Simple Earn|Products?)/g),
  ].map((match) => match[1]);
  const assets = unique([...pairAssets, ...parenthesisAssets, ...productAssets])
    .filter((asset) => !IGNORED_ASSETS.has(asset))
    .slice(0, 12);
  const aprMatches = unique([...normalized.matchAll(/(?:up to\s*)?\d+(?:\.\d+)?\s*%\s*(?:APR|APY|rewards?|bonus|boost)?/gi)].map((match) => normalizeSpaces(match[0]))).slice(0, 6);
  const rewardMatches = unique([...normalized.matchAll(/(?:share|win|grab|earn|receive|get|up to)[^.!?]{0,120}(?:USDT|FDUSD|BNB|token vouchers?|rewards?|reward vouchers?|points?)/gi)].map((match) => normalizeSpaces(match[0]))).slice(0, 4);
  const periodMatches = unique([...normalized.matchAll(/(?:campaign|promotion|activity|subscription)\s+period\s*:\s*[^.]{10,120}/gi)].map((match) => normalizeSpaces(match[0]))).slice(0, 2);

  return {
    assets,
    pairs,
    apr: aprMatches,
    rewards: rewardMatches,
    periods: periodMatches,
  };
}

function classifyEvent(text) {
  if (/simple earn|earn|staking|locked product|flexible product|apr|apy/i.test(text)) {
    return "earn";
  }
  if (/zero trading fee|fee campaign/i.test(text)) {
    return "fee";
  }
  if (/trading tournament|trading competition|trade to share/i.test(text)) {
    return "trading";
  }
  if (/launchpool|megadrop|airdrop/i.test(text)) {
    return "launch";
  }
  return "event";
}

export function isAprEvent(event) {
  const text = normalizeSpaces(`${event.title} ${event.excerpt} ${event.apr?.join(" ") ?? ""}`);
  return event.type === "earn" && /apr|apy|simple earn|staking|locked product|flexible product/i.test(text);
}

export function mapAprEventAlert(event) {
  const assets = event.assets?.length > 0 ? event.assets.slice(0, 4).join(", ") : "토큰 미확인";
  const apr = event.apr?.length > 0 ? event.apr.slice(0, 2).join(" / ") : "APR 조건 본문 확인 필요";
  const reward = event.rewards?.[0] ? ` · ${event.rewards[0]}` : "";

  return {
    title: event.title,
    body: `${assets} · ${apr}${reward}`,
    time: new Date(event.releaseDate).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    level: "success",
    url: event.url,
    eventCode: event.code,
    releaseDate: event.releaseDate,
  };
}

async function fetchArticleDetail(article) {
  const detail = await fetchBinanceCms("/bapi/composite/v1/public/cms/article/detail/query", {
    articleCode: article.code,
  });
  const bodyTree = typeof detail.body === "string" ? safeParseJson(detail.body) : null;
  const contentTree = typeof detail.contentJson === "string" ? safeParseJson(detail.contentJson) : null;
  const text = normalizeSpaces([
    detail.title,
    collectBodyText(bodyTree),
    collectBodyText(contentTree),
  ].join(" "));
  const signals = extractSignals(text);

  return {
    id: detail.id ?? article.id,
    code: detail.code ?? article.code,
    title: detail.title ?? article.title,
    releaseDate: detail.publishDate ?? article.releaseDate,
    url: `${BINANCE_WEB_BASE_URL}/en/support/announcement/${detail.code ?? article.code}`,
    type: classifyEvent(text),
    excerpt: text.slice(0, 260),
    ...signals,
  };
}

function mapLightweightArticle(article) {
  const text = normalizeSpaces(article.title);
  const signals = extractSignals(text);
  return {
    id: article.id,
    code: article.code,
    title: article.title,
    releaseDate: article.releaseDate,
    url: `${BINANCE_WEB_BASE_URL}/en/support/announcement/${article.code}`,
    type: classifyEvent(text),
    excerpt: text,
    ...signals,
  };
}

export async function fetchEarningEvents({ pageNo = "1", pageSize = "12", detailSize = "8" } = {}) {
  const now = Date.now();
  const normalizedPageSize = normalizePageSize(pageSize);
  const cacheKey = `${pageNo}:${normalizedPageSize}:${detailSize}`;
  const cached = eventCache.get(cacheKey);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return {
      ok: true,
      status: 200,
      data: {
        ...cached.data,
        cached: true,
      },
    };
  }

  const list = await fetchBinanceCms("/bapi/composite/v1/public/cms/article/list/query", {
    type: "1",
    catalogId: ACTIVITY_CATALOG_ID,
    pageNo: String(pageNo),
    pageSize: String(normalizedPageSize),
  });
  const catalog = Array.isArray(list.catalogs) ? list.catalogs[0] : null;
  const articles = Array.isArray(catalog?.articles) ? catalog.articles : [];
  const detailLimit = Math.min(Math.max(Number(detailSize) || 0, 0), articles.length);
  const detailed = await Promise.all(articles.slice(0, detailLimit).map(async (article) => {
    try {
      return await fetchArticleDetail(article);
    } catch {
      return mapLightweightArticle(article);
    }
  }));
  const lightweight = articles.slice(detailLimit).map(mapLightweightArticle);
  const rows = [...detailed, ...lightweight];

  const data = {
    catalogId: Number(ACTIVITY_CATALOG_ID),
    catalogName: catalog?.catalogName ?? "Latest Activities",
    total: catalog?.total ?? rows.length,
    fetched: rows.length,
    sourceUrl: `${BINANCE_WEB_BASE_URL}/en/support/announcement/list/${ACTIVITY_CATALOG_ID}`,
    rows,
  };
  eventCache.set(cacheKey, {
    cachedAt: now,
    data,
  });

  return {
    ok: true,
    status: 200,
    data: {
      ...data,
      cached: false,
    },
  };
}
