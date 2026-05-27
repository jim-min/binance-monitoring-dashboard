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
  updatedAt?: string;
};

export type MarketConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

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

export type SimpleEarnProduct = {
  productType: "FLEXIBLE" | "LOCKED";
  asset: string;
  productId: string;
  apr: number;
  tierApr: string;
  canPurchase: boolean;
  canRedeem: boolean;
  isSoldOut: boolean;
  hot: boolean;
  minPurchaseAmount: string;
  status: string;
  duration: string;
  rewardAsset: string;
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

export type ArbitrageOpportunity = {
  id: string;
  type: "triangular" | "basis";
  path: string;
  legs: string[];
  grossPct: number;
  netPct: number;
  estimatedSize: string;
  status: "ready" | "watching" | "costly" | "waiting";
  updatedAt: string;
};
