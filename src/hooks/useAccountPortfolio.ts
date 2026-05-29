import { useEffect, useState } from "react";
import type { AccountPortfolio } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

export function useAccountPortfolio() {
  const [portfolio, setPortfolio] = useState<AccountPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("-");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/account/portfolio`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.msg ?? payload.error ?? "Portfolio fetch failed");
        }

        setPortfolio(payload);
        setLastUpdatedAt(new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Portfolio fetch failed");
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
    portfolio,
    isLoading,
    error,
    lastUpdatedAt,
  };
}
