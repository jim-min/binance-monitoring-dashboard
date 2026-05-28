import { useEffect, useMemo, useState } from "react";
import type { EarningEvent } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

export function useEarningEvents() {
  const [events, setEvents] = useState<EarningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("-");
  const [sourceUrl, setSourceUrl] = useState("https://www.binance.com/en/support/announcement/list/93");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/earning-events?pageSize=20&detailSize=8`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? payload.msg ?? "Earning event fetch failed");
        }

        setEvents(Array.isArray(payload.rows) ? payload.rows : []);
        setSourceUrl(payload.sourceUrl ?? "https://www.binance.com/en/support/announcement/list/93");
        setLastUpdatedAt(new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Earning event fetch failed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 1800000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const earnRelatedCount = useMemo(() => events.filter((event) => event.type === "earn").length, [events]);

  return {
    events,
    isLoading,
    error,
    lastUpdatedAt,
    sourceUrl,
    earnRelatedCount,
  };
}
