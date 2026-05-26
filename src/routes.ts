import type { Page } from "./types";

export const pagePaths: Record<Page, string> = {
  overview: "/",
  markets: "/markets",
  earn: "/earn",
  hedge: "/hedge",
  arbitrage: "/arbitrage",
};

export const pageLabels: Record<Page, string> = {
  overview: "Overview",
  markets: "Market Watch",
  earn: "Earn Screener",
  hedge: "Hedge Lab",
  arbitrage: "Arbitrage Monitor",
};

export const pageFromPath = (path: string): Page => {
  const found = (Object.entries(pagePaths) as Array<[Page, string]>).find(([, value]) => value === path);
  return found?.[0] ?? "overview";
};
