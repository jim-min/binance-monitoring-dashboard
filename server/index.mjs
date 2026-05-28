import { createServer } from "node:http";
import {
  fetchAllSimpleEarnProducts,
  fetchEarnFuturesUniverse,
  fetchFlexibleEarnProducts,
  fetchLockedEarnProducts,
} from "./binance.mjs";
import { fetchEarningEvents } from "./earningEvents.mjs";
import { configStatus, env } from "./env.mjs";
import { runStrategyBacktest } from "./strategy.mjs";
import { sendTelegramMessage } from "./telegram.mjs";

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
