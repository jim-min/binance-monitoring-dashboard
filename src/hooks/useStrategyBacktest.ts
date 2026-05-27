import { useEffect, useMemo, useState } from "react";
import type { StrategyBacktest } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

export type StrategyBacktestParams = {
  symbol: string;
  principal: number;
  days: number;
  earnAprPct: number;
  hedgeRatioPct: number;
  spotFeeBps: number;
  futuresFeeBps: number;
  slippageBps: number;
};

export function useStrategyBacktest(params: StrategyBacktestParams) {
  const [data, setData] = useState<StrategyBacktest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const search = new URLSearchParams({
      symbol: params.symbol,
      principal: String(params.principal),
      days: String(params.days),
      earnApr: String(params.earnAprPct / 100),
      hedgeRatio: String(params.hedgeRatioPct / 100),
      spotFeeBps: String(params.spotFeeBps),
      futuresFeeBps: String(params.futuresFeeBps),
      slippageBps: String(params.slippageBps),
    });
    return search.toString();
  }, [
    params.days,
    params.earnAprPct,
    params.futuresFeeBps,
    params.hedgeRatioPct,
    params.principal,
    params.slippageBps,
    params.spotFeeBps,
    params.symbol,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/strategy/backtest?${query}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Strategy backtest failed");
        }

        setData(payload);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Strategy backtest failed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return {
    data,
    isLoading,
    error,
  };
}
