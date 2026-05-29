import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import {
  fetchAllSimpleEarnProducts,
  fetchAccountPortfolio,
  fetchEarnFuturesUniverse,
  fetchFlexibleEarnProducts,
  fetchLockedEarnProducts,
} from "./binance.mjs";
import { fetchEarningEvents, isAprEvent, mapAprEventAlert } from "./earningEvents.mjs";
import { configStatus, env } from "./env.mjs";
import { runStrategyBacktest } from "./strategy.mjs";
import { sendTelegramMessage } from "./telegram.mjs";

const alertStateFile = new URL("../.alert-state.json", import.meta.url);

const loadNotifiedAprEventCodes = () => {
  try {
    const state = JSON.parse(readFileSync(alertStateFile, "utf8"));
    return new Set(Array.isArray(state.notifiedAprEventCodes) ? state.notifiedAprEventCodes : []);
  } catch {
    return new Set();
  }
};

const notifiedAprEventCodes = loadNotifiedAprEventCodes();
const pendingAprEventCodes = new Set();

const saveNotifiedAprEventCodes = () => {
  writeFileSync(alertStateFile, JSON.stringify({
    notifiedAprEventCodes: [...notifiedAprEventCodes],
    updatedAt: new Date().toISOString(),
  }, null, 2));
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const json = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "http://127.0.0.1:5173",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
};

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (method === "OPTIONS") {
    return json(response, 204, {});
  }

  if (method === "GET" && url.pathname === "/api/health") {
    return json(response, 200, {
      ok: true,
      service: "binance-monitoring-dashboard-api",
      time: new Date().toISOString(),
    });
  }

  if (method === "GET" && url.pathname === "/api/config/status") {
    return json(response, 200, {
      ok: true,
      config: configStatus(),
    });
  }

  if (method === "GET" && url.pathname === "/api/account/portfolio") {
    const result = await fetchAccountPortfolio();
    return json(response, result.status, {
      ok: result.ok,
      ...result.data,
    });
  }

  if (method === "GET" && url.pathname === "/api/simple-earn/flexible") {
    const result = await fetchFlexibleEarnProducts();
    return json(response, result.status, {
      ok: result.ok,
      ...result.data,
    });
  }

  if (method === "GET" && url.pathname === "/api/simple-earn/locked") {
    const result = await fetchLockedEarnProducts();
    return json(response, result.status, {
      ok: result.ok,
      ...result.data,
    });
  }

  if (method === "GET" && url.pathname === "/api/simple-earn/products") {
    const result = await fetchAllSimpleEarnProducts();
    return json(response, result.status, {
      ok: result.ok,
      ...result.data,
    });
  }

  if (method === "GET" && url.pathname === "/api/earning-events") {
    try {
      const result = await fetchEarningEvents(Object.fromEntries(url.searchParams));
      return json(response, result.status, {
        ok: result.ok,
        ...result.data,
      });
    } catch (error) {
      return json(response, 502, {
        ok: false,
        error: error instanceof Error ? error.message : "Earning event fetch failed",
      });
    }
  }

  if (method === "GET" && url.pathname === "/api/alerts/apr-events") {
    try {
      const shouldNotify = url.searchParams.get("notify") === "1";
      const scanPages = Math.min(Math.max(Number(url.searchParams.get("pages") ?? 5), 1), 10);
      const results = await Promise.all(Array.from({ length: scanPages }, (_, index) => fetchEarningEvents({
        pageNo: String(index + 1),
        pageSize: "20",
        detailSize: "0",
      })));
      const events = results
        .flatMap((result) => result.data.rows)
        .filter(isAprEvent)
        .sort((a, b) => b.releaseDate - a.releaseDate);
      const alerts = events.map(mapAprEventAlert);
      const newAlerts = alerts
        .filter((alert) => !notifiedAprEventCodes.has(alert.eventCode) && !pendingAprEventCodes.has(alert.eventCode))
        .slice(0, 5);
      let telegram = null;

      if (shouldNotify && newAlerts.length > 0) {
        newAlerts.forEach((alert) => pendingAprEventCodes.add(alert.eventCode));
        const message = [
          "<b>Binance APR Event Alert</b>",
          ...newAlerts.map((alert) => [
            "",
            `<b>${escapeHtml(alert.title)}</b>`,
            escapeHtml(alert.body),
            alert.url,
          ].join("\n")),
        ].join("\n");

        try {
          telegram = await sendTelegramMessage(message);

          if (telegram.ok) {
            newAlerts.forEach((alert) => notifiedAprEventCodes.add(alert.eventCode));
            saveNotifiedAprEventCodes();
          }
        } finally {
          newAlerts.forEach((alert) => pendingAprEventCodes.delete(alert.eventCode));
        }
      }

      return json(response, 200, {
        ok: true,
        alerts,
        total: alerts.length,
        notified: shouldNotify ? newAlerts.length : 0,
        telegram,
      });
    } catch (error) {
      return json(response, 502, {
        ok: false,
        error: error instanceof Error ? error.message : "APR event alert fetch failed",
      });
    }
  }

  if (method === "GET" && url.pathname === "/api/strategy/backtest") {
    try {
      const result = await runStrategyBacktest(Object.fromEntries(url.searchParams));
      return json(response, 200, result);
    } catch (error) {
      return json(response, 502, {
        ok: false,
        error: error instanceof Error ? error.message : "Strategy backtest failed",
      });
    }
  }

  if (method === "GET" && url.pathname === "/api/strategy/eligible-symbols") {
    const result = await fetchEarnFuturesUniverse();
    return json(response, result.status, {
      ok: result.ok,
      ...result.data,
    });
  }

  if (method === "POST" && url.pathname === "/api/telegram/test") {
    const body = await readBody(request);
    const text = typeof body.message === "string" && body.message.trim()
      ? body.message
      : "Binance Monitoring Dashboard Telegram test";
    const result = await sendTelegramMessage(text);
    return json(response, result.ok ? 200 : 400, result);
  }

  return json(response, 404, {
    ok: false,
    error: "Not found",
  });
});

server.listen(env.apiPort, "127.0.0.1", () => {
  console.log(`API server running on http://127.0.0.1:${env.apiPort}`);
});
