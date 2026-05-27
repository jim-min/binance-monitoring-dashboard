import { useEffect, useMemo, useRef, useState } from "react";
import type { ArbitrageOpportunity, MarketConnectionStatus } from "../types";

type BookTicker = {
  symbol: string;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  updatedAt: number;
};

type BinanceBookTickerPayload = {
  s: string;
  b: string;
  B: string;
  a: string;
  A: string;
  E?: number;
  T?: number;
};

type BinanceCombinedMessage = {
  stream?: string;
  data?: BinanceBookTickerPayload;
};

const spotSymbols = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TRXUSDT",
  "LINKUSDT",
  "LTCUSDT",
  "ETHBTC",
  "BNBBTC",
  "XRPBTC",
  "SOLBTC",
  "ADABTC",
  "DOGEBTC",
  "TRXBTC",
  "LINKBTC",
  "LTCBTC",
  "XRPBNB",
  "ADABNB",
  "TRXBNB",
  "DOGEBNB",
  "LINKBNB",
  "LTCBNB",
];
const futuresSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "TRXUSDT", "LINKUSDT", "LTCUSDT"];
const spotUrl = `wss://stream.binance.com:9443/stream?streams=${spotSymbols.map((symbol) => `${symbol.toLowerCase()}@bookTicker`).join("/")}`;
const futuresUrl = `wss://fstream.binance.com/stream?streams=${futuresSymbols.map((symbol) => `${symbol.toLowerCase()}@bookTicker`).join("/")}`;

const spotFeeRate = 0.001;
const slippageRate = 0.0002;
const futuresFeeRate = 0.0005;

const triangularRoutes = [
  { id: "tri-btc-eth", path: "USDT -> BTC -> ETH -> USDT", legs: ["BTCUSDT ask", "ETHBTC ask", "ETHUSDT bid"], symbols: ["BTCUSDT", "ETHBTC", "ETHUSDT"] },
  { id: "tri-btc-bnb", path: "USDT -> BTC -> BNB -> USDT", legs: ["BTCUSDT ask", "BNBBTC ask", "BNBUSDT bid"], symbols: ["BTCUSDT", "BNBBTC", "BNBUSDT"] },
  { id: "tri-btc-xrp", path: "USDT -> BTC -> XRP -> USDT", legs: ["BTCUSDT ask", "XRPBTC ask", "XRPUSDT bid"], symbols: ["BTCUSDT", "XRPBTC", "XRPUSDT"] },
  { id: "tri-btc-sol", path: "USDT -> BTC -> SOL -> USDT", legs: ["BTCUSDT ask", "SOLBTC ask", "SOLUSDT bid"], symbols: ["BTCUSDT", "SOLBTC", "SOLUSDT"] },
  { id: "tri-btc-ada", path: "USDT -> BTC -> ADA -> USDT", legs: ["BTCUSDT ask", "ADABTC ask", "ADAUSDT bid"], symbols: ["BTCUSDT", "ADABTC", "ADAUSDT"] },
  { id: "tri-btc-doge", path: "USDT -> BTC -> DOGE -> USDT", legs: ["BTCUSDT ask", "DOGEBTC ask", "DOGEUSDT bid"], symbols: ["BTCUSDT", "DOGEBTC", "DOGEUSDT"] },
  { id: "tri-btc-trx", path: "USDT -> BTC -> TRX -> USDT", legs: ["BTCUSDT ask", "TRXBTC ask", "TRXUSDT bid"], symbols: ["BTCUSDT", "TRXBTC", "TRXUSDT"] },
  { id: "tri-btc-link", path: "USDT -> BTC -> LINK -> USDT", legs: ["BTCUSDT ask", "LINKBTC ask", "LINKUSDT bid"], symbols: ["BTCUSDT", "LINKBTC", "LINKUSDT"] },
  { id: "tri-btc-ltc", path: "USDT -> BTC -> LTC -> USDT", legs: ["BTCUSDT ask", "LTCBTC ask", "LTCUSDT bid"], symbols: ["BTCUSDT", "LTCBTC", "LTCUSDT"] },
  { id: "tri-bnb-xrp", path: "USDT -> BNB -> XRP -> USDT", legs: ["BNBUSDT ask", "XRPBNB ask", "XRPUSDT bid"], symbols: ["BNBUSDT", "XRPBNB", "XRPUSDT"] },
  { id: "tri-bnb-ada", path: "USDT -> BNB -> ADA -> USDT", legs: ["BNBUSDT ask", "ADABNB ask", "ADAUSDT bid"], symbols: ["BNBUSDT", "ADABNB", "ADAUSDT"] },
  { id: "tri-bnb-trx", path: "USDT -> BNB -> TRX -> USDT", legs: ["BNBUSDT ask", "TRXBNB ask", "TRXUSDT bid"], symbols: ["BNBUSDT", "TRXBNB", "TRXUSDT"] },
  { id: "tri-bnb-doge", path: "USDT -> BNB -> DOGE -> USDT", legs: ["BNBUSDT ask", "DOGEBNB ask", "DOGEUSDT bid"], symbols: ["BNBUSDT", "DOGEBNB", "DOGEUSDT"] },
  { id: "tri-bnb-link", path: "USDT -> BNB -> LINK -> USDT", legs: ["BNBUSDT ask", "LINKBNB ask", "LINKUSDT bid"], symbols: ["BNBUSDT", "LINKBNB", "LINKUSDT"] },
  { id: "tri-bnb-ltc", path: "USDT -> BNB -> LTC -> USDT", legs: ["BNBUSDT ask", "LTCBNB ask", "LTCUSDT bid"], symbols: ["BNBUSDT", "LTCBNB", "LTCUSDT"] },
] as const;

const basisSymbols = ["SOLUSDT", "BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "TRXUSDT", "LINKUSDT", "LTCUSDT"];

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const timeLabel = (timestamp?: number) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const toBookTicker = (data: BinanceBookTickerPayload): BookTicker => ({
  symbol: data.s,
  bid: Number(data.b),
  ask: Number(data.a),
  bidQty: Number(data.B),
  askQty: Number(data.A),
  updatedAt: data.E ?? data.T ?? Date.now(),
});

const validBook = (book?: BookTicker) => Boolean(book && book.bid > 0 && book.ask > 0);

const quoteCapacity = (book?: BookTicker) => {
  if (!book) {
    return 0;
  }
  return Math.min(book.ask * book.askQty, book.bid * book.bidQty);
};

const statusForNet = (netPct: number): ArbitrageOpportunity["status"] => {
  if (netPct > 0.08) {
    return "ready";
  }
  if (netPct > -0.12) {
    return "watching";
  }
  return "costly";
};

const waitingOpportunity = (id: string, type: ArbitrageOpportunity["type"], path: string, legs: string[]): ArbitrageOpportunity => ({
  id,
  type,
  path,
  legs,
  grossPct: 0,
  netPct: 0,
  estimatedSize: "-",
  status: "waiting",
  updatedAt: "-",
});

const buildTriangularOpportunity = (
  id: string,
  path: string,
  legs: string[],
  first: BookTicker | undefined,
  second: BookTicker | undefined,
  third: BookTicker | undefined,
) => {
  if (!validBook(first) || !validBook(second) || !validBook(third)) {
    return waitingOpportunity(id, "triangular", path, legs);
  }

  const grossRate = (1 / first!.ask / second!.ask) * third!.bid;
  const grossPct = (grossRate - 1) * 100;
  const netPct = grossPct - (spotFeeRate + slippageRate) * 3 * 100;
  const capacity = Math.min(quoteCapacity(first), quoteCapacity(third));

  return {
    id,
    type: "triangular",
    path,
    legs,
    grossPct,
    netPct,
    estimatedSize: compactUsd.format(Math.max(0, capacity)),
    status: statusForNet(netPct),
    updatedAt: timeLabel(Math.max(first!.updatedAt, second!.updatedAt, third!.updatedAt)),
  } satisfies ArbitrageOpportunity;
};

const buildBasisOpportunity = (
  id: string,
  symbol: string,
  spot: BookTicker | undefined,
  futures: BookTicker | undefined,
) => {
  const path = `${symbol} Spot buy -> ${symbol} Perp short`;
  const legs = [`${symbol} spot ask`, `${symbol} perp bid`];

  if (!validBook(spot) || !validBook(futures)) {
    return waitingOpportunity(id, "basis", path, legs);
  }

  const grossPct = (futures!.bid / spot!.ask - 1) * 100;
  const netPct = grossPct - (spotFeeRate + futuresFeeRate + slippageRate * 2) * 100;
  const capacity = Math.min(spot!.ask * spot!.askQty, futures!.bid * futures!.bidQty);

  return {
    id,
    type: "basis",
    path,
    legs,
    grossPct,
    netPct,
    estimatedSize: compactUsd.format(Math.max(0, capacity)),
    status: statusForNet(netPct),
    updatedAt: timeLabel(Math.max(spot!.updatedAt, futures!.updatedAt)),
  } satisfies ArbitrageOpportunity;
};

export function useArbitrageMonitor() {
  const [spotBooks, setSpotBooks] = useState<Record<string, BookTicker>>({});
  const [futuresBooks, setFuturesBooks] = useState<Record<string, BookTicker>>({});
  const [spotStatus, setSpotStatus] = useState<MarketConnectionStatus>("connecting");
  const [futuresStatus, setFuturesStatus] = useState<MarketConnectionStatus>("connecting");
  const reconnectTimers = useRef<number[]>([]);
  const shouldReconnect = useRef(true);
  const sockets = useRef<WebSocket[]>([]);

  useEffect(() => {
    shouldReconnect.current = true;

    const connect = (
      url: string,
      updateBooks: React.Dispatch<React.SetStateAction<Record<string, BookTicker>>>,
      updateStatus: React.Dispatch<React.SetStateAction<MarketConnectionStatus>>,
    ) => {
      updateStatus("connecting");
      const socket = new WebSocket(url);
      sockets.current.push(socket);

      socket.onopen = () => updateStatus("live");
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as BinanceCombinedMessage;
          if (!message.data?.s) {
            return;
          }
          const book = toBookTicker(message.data);
          updateBooks((current) => ({
            ...current,
            [book.symbol]: book,
          }));
        } catch {
          updateStatus("reconnecting");
        }
      };
      socket.onerror = () => updateStatus("reconnecting");
      socket.onclose = () => {
        if (!shouldReconnect.current) {
          return;
        }
        updateStatus("reconnecting");
        const timer = window.setTimeout(() => connect(url, updateBooks, updateStatus), 3000);
        reconnectTimers.current.push(timer);
      };
    };

    connect(spotUrl, setSpotBooks, setSpotStatus);
    connect(futuresUrl, setFuturesBooks, setFuturesStatus);

    return () => {
      shouldReconnect.current = false;
      reconnectTimers.current.forEach((timer) => window.clearTimeout(timer));
      sockets.current.forEach((socket) => socket.close());
      setSpotStatus("offline");
      setFuturesStatus("offline");
    };
  }, []);

  const opportunities = useMemo(() => {
    const rows: ArbitrageOpportunity[] = [
      ...triangularRoutes.map((route) => buildTriangularOpportunity(
        route.id,
        route.path,
        [...route.legs],
        spotBooks[route.symbols[0]],
        spotBooks[route.symbols[1]],
        spotBooks[route.symbols[2]],
      )),
      ...basisSymbols.map((symbol) => buildBasisOpportunity(`basis-${symbol.toLowerCase()}`, symbol, spotBooks[symbol], futuresBooks[symbol])),
    ];

    return rows.sort((a, b) => {
      if (a.status === "waiting" && b.status !== "waiting") {
        return 1;
      }
      if (a.status !== "waiting" && b.status === "waiting") {
        return -1;
      }
      return b.netPct - a.netPct;
    });
  }, [futuresBooks, spotBooks]);

  const liveCount = opportunities.filter((row) => row.status !== "waiting").length;
  const actionableCount = opportunities.filter((row) => row.status === "ready").length;
  const lastUpdatedAt = opportunities.find((row) => row.status !== "waiting")?.updatedAt ?? "-";

  return {
    opportunities,
    liveCount,
    actionableCount,
    lastUpdatedAt,
    spotStatus,
    futuresStatus,
  };
}
