export type Page = "overview" | "markets" | "earn" | "hedge" | "arbitrage";

export type Coin = {
  symbol: string;
  name: string;
  price: string;
  change: number;
  volume: string;
  high: string;
  low: string;
  spread: string;
};

export type EarnProduct = {
  symbol: string;
  apr: string;
  baseApr: string;
  event: string;
  status: string;
  quota: string;
  futures: string;
  netApr: string;
};

export type Alert = {
  title: string;
  body: string;
  time: string;
  level: "info" | "warning" | "success";
};

export type ArbitrageSignal = {
  path: string;
  profit: string;
  size: string;
  status: string;
};
