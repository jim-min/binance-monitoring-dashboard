import { useEffect, useState } from "react";
import type { Alert } from "../types";

const API_BASE_URL = "http://127.0.0.1:8787";

export function useAprEventAlerts({ notify = false } = {}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("-");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/alerts/apr-events${notify ? "?notify=1" : ""}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "APR event alert fetch failed");
        }

        setAlerts(Array.isArray(payload.alerts) ? payload.alerts : []);
        setLastUpdatedAt(new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "APR event alert fetch failed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 300000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [notify]);

  return {
    alerts,
    isLoading,
    error,
    lastUpdatedAt,
  };
}
