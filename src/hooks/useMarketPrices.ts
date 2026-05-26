import { useEffect, useMemo, useRef, useState } from "react";
import { coins as fallbackCoins } from "../data/mock";
import type { Coin, MarketConnectionStatus } from "../types";

type BinanceTickerPayload = {
  s: string;
  c: string;
  P: string;
  h: string;
  l: string;
  q: string;
  b?: string;
  a?: string;
  E?: number;
};

type BinanceCombinedMessage = {
  stream?: string;
  data?: BinanceTickerPayload;
};

const streamSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "TRXUSDT", "XRPUSDT"];
const streamUrl = `wss://stream.binance.com:9443/stream?streams=${streamSymbols
  .map((symbol) => `${symbol.toLowerCase()}@ticker`)
  .join("/")}`;

const compactCurrency = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const priceFormatter = (value: number) => {
  const maximumFractionDigits = value >= 1000 ? 2 : value >= 1 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits,
  });
};

const formatVolume = (quoteVolume: number) => `$${compactCurrency.format(quoteVolume)}`;

const formatSpread = (bid?: string, ask?: string) => {
  const bidValue = Number(bid);
  const askValue = Number(ask);

  if (!Number.isFinite(bidValue) || !Number.isFinite(askValue) || bidValue <= 0 || askValue <= 0) {
    return "-";
  }

  const mid = (bidValue + askValue) / 2;
  return `${(((askValue - bidValue) / mid) * 100).toFixed(3)}%`;
};

const formatUpdatedAt = (eventTime?: number) => {
  const date = eventTime ? new Date(eventTime) : new Date();
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const mergeTicker = (coin: Coin, ticker: BinanceTickerPayload): Coin => ({
  ...coin,
  price: priceFormatter(Number(ticker.c)),
  change: Number(ticker.P),
  volume: formatVolume(Number(ticker.q)),
  high: priceFormatter(Number(ticker.h)),
  low: priceFormatter(Number(ticker.l)),
  spread: formatSpread(ticker.b, ticker.a),
  updatedAt: formatUpdatedAt(ticker.E),
});

export function useMarketPrices() {
  const [coins, setCoins] = useState<Coin[]>(fallbackCoins);
  const [status, setStatus] = useState<MarketConnectionStatus>("connecting");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("-");
  const reconnectTimer = useRef<number | undefined>(undefined);
  const reconnectAttempt = useRef(0);
  const shouldReconnect = useRef(true);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    shouldReconnect.current = true;

    const connect = () => {
      setStatus(reconnectAttempt.current > 0 ? "reconnecting" : "connecting");
      const socket = new WebSocket(streamUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempt.current = 0;
        setStatus("live");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as BinanceCombinedMessage;
          const ticker = message.data;

          if (!ticker?.s) {
            return;
          }

          const baseSymbol = ticker.s.replace("USDT", "");
          setCoins((current) => current.map((coin) => (coin.symbol === baseSymbol ? mergeTicker(coin, ticker) : coin)));
          setLastUpdatedAt(formatUpdatedAt(ticker.E));
        } catch {
          setStatus("reconnecting");
        }
      };

      socket.onerror = () => {
        setStatus("reconnecting");
      };

      socket.onclose = () => {
        if (!shouldReconnect.current) {
          return;
        }

        setStatus("reconnecting");
        reconnectAttempt.current += 1;
        const delay = Math.min(10000, 1000 * reconnectAttempt.current);
        reconnectTimer.current = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      socketRef.current?.close();
      setStatus("offline");
    };
  }, []);

  const statusLabel = useMemo(() => {
    const labels: Record<MarketConnectionStatus, string> = {
      connecting: "연결 중",
      live: "Live",
      reconnecting: "재연결 중",
      offline: "오프라인",
    };
    return labels[status];
  }, [status]);

  return {
    coins,
    lastUpdatedAt,
    status,
    statusLabel,
  };
}
