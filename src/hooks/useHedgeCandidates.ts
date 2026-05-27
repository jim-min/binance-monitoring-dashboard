import { useEffect, useState } from "react";
import type { HedgeCandidate } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

const fallbackCandidates: HedgeCandidate[] = [
  { asset: "TRX", symbol: "TRXUSDT", quoteAsset: "USDT", marginAsset: "USDT", productCount: 1, maxApr: 0.186, hasFlexible: true, hasLocked: false, canPurchase: true },
  { asset: "BTC", symbol: "BTCUSDT", quoteAsset: "USDT", marginAsset: "USDT", productCount: 1, maxApr: 0.015, hasFlexible: true, hasLocked: false, canPurchase: true },
  { asset: "ETH", symbol: "ETHUSDT", quoteAsset: "USDT", marginAsset: "USDT", productCount: 1, maxApr: 0.024, hasFlexible: true, hasLocked: false, canPurchase: true },
  { asset: "SOL", symbol: "SOLUSDT", quoteAsset: "USDT", marginAsset: "USDT", productCount: 1, maxApr: 0.045, hasFlexible: true, hasLocked: false, canPurchase: true },
];

export function useHedgeCandidates() {
  const [candidates, setCandidates] = useState<HedgeCandidate[]>(fallbackCandidates);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("-");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/strategy/eligible-symbols`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.msg ?? payload.error ?? "Eligible symbol fetch failed");
        }

        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        setCandidates(rows);
        setLastUpdatedAt(new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Eligible symbol fetch failed");
          setCandidates(fallbackCandidates);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 180000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return {
    candidates,
    isLoading,
    error,
    lastUpdatedAt,
  };
}
