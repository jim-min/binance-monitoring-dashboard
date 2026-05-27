import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useMarketPrices } from "../hooks/useMarketPrices";
import { MiniChart } from "./MiniChart";
import { PanelHeader } from "./PanelHeader";

type MarketSortKey = "symbol" | "change" | "price" | "volume";

const numeric = (value: string) => Number(value.replace(/[$,%]/g, "").replace(/,/g, ""));
const compactNumeric = (value: string) => {
  const normalized = value.replace(/[$,%]/g, "").replace(/,/g, "");
  const multiplier = normalized.endsWith("K") ? 1_000 : normalized.endsWith("M") ? 1_000_000 : normalized.endsWith("B") ? 1_000_000_000 : 1;
  return Number.parseFloat(normalized) * multiplier || 0;
};

export function MarketPanel({ compact = false }: { compact?: boolean }) {
  const { coins, lastUpdatedAt, status, statusLabel } = useMarketPrices();
  const [sortKey, setSortKey] = useState<MarketSortKey>("change");
  const sortedCoins = useMemo(() => [...coins].sort((a, b) => {
    if (sortKey === "symbol") {
      return a.symbol.localeCompare(b.symbol);
    }
    if (sortKey === "price") {
      return numeric(b.price) - numeric(a.price);
    }
    if (sortKey === "volume") {
      return compactNumeric(b.volume) - compactNumeric(a.volume);
    }
    return b.change - a.change;
  }), [coins, sortKey]);

  return (
    <section className="panel market-panel">
      <PanelHeader title="Market Watch" subtitle={`메이저 코인 실시간 가격 · ${lastUpdatedAt}`} action={statusLabel} />
      <div className="panel-tools">
        <div className={`market-status ${status}`}>
          <span />
          Binance Spot WebSocket
        </div>
        <label className="sort-control">
          <span>정렬</span>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as MarketSortKey)}>
            <option value="change">등락률 높은 순</option>
            <option value="volume">거래대금 높은 순</option>
            <option value="price">가격 높은 순</option>
            <option value="symbol">심볼명</option>
          </select>
          <ChevronDown size={16} />
        </label>
      </div>
      <div className={`coin-grid ${compact ? "" : "wide"}`}>
        {sortedCoins.map((coin) => (
          <article className="coin-tile" key={coin.symbol}>
            <div className="coin-head">
              <div className="coin-icon">{coin.symbol.slice(0, 1)}</div>
              <div>
                <strong>{coin.symbol}</strong>
                <small>{coin.name}</small>
              </div>
              <span className={coin.change >= 0 ? "change up" : "change down"}>
                {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
              </span>
            </div>
            <div className="price-row">${coin.price}</div>
            <MiniChart positive={coin.change >= 0} />
            <div className="coin-meta">
              <span>Vol {coin.volume}</span>
              <span>Spread {coin.spread}</span>
            </div>
            {coin.updatedAt && <div className="coin-updated">Updated {coin.updatedAt}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}
